import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { VMService } from '../../services/vm_service/vm_service';
import { CompleterData, CompleterService } from 'ng2-completer';
import { VMPool } from '../../services/vm_service/vm_pool';

import {
  ReservationRequestDto, ReservationService,
  ReservationService,
} from '../../services/reservation_service/reservationService';
import { AlertService } from '../../services/UI_tools/alertService';
import moment = require('moment');

@Component({
  selector: 'ngx-reservation-component',
  templateUrl: './reservation.html',
  styleUrls: ['./reservation.scss'],
})

export class ReservationComponent {
  private form: FormGroup;

  private vmPoolCompleterData: CompleterData;
  private vmPools: VMPool[];

  private dates;

  private timings: FormGroup;

  private completerTouched: boolean = false;
  private endDateIsLast: boolean = true;

  touchCompleter(): void {
    this.completerTouched = true;
  }

  constructor(private vmService: VMService, private reservationService: ReservationService,
              private completerService: CompleterService, private formBuilder: FormBuilder, private alertService: AlertService) {
    this.vmPoolCompleterData = this.completerService
      .local(this.vmService.getVMPools().map(vmPools => this.vmPools = vmPools), 'displayName', 'displayName');

    this.form = this.formBuilder.group({
      courseName: new FormControl('', Validators.required),
      machinesNumber: new FormControl('', Validators.compose([Validators.pattern('[0-9]+'), Validators.required])),
      vmPool: new FormControl('', Validators.required),
      timings: this.formBuilder.group({
        startTime: new FormControl('', Validators.required),
        endTime: new FormControl('', Validators.required),
      }, {validator: TimingsValidator.validate('startTime', 'endTime')}),
      dates: this.formBuilder.array([this.createDate()]),
      cyclic: new FormControl('', null),
      endDate: new FormControl('', null),
      interval: new FormControl('', null),
    });

    this.timings = <FormGroup>this.form.controls['timings'];

    this.form.controls['cyclic'].valueChanges.subscribe(value => {
      if (value) {
        this.form.controls['endDate'].setValidators([Validators.required]);
        this.form.controls['interval'].setValidators([Validators.pattern('[0-9]+'), Validators.required]);
      } else {
        this.form.controls['endDate'].setValidators([]);
        this.form.controls['interval'].setValidators([]);
        this.form.controls['endDate'].clearValidators();
        this.form.controls['interval'].clearValidators();
      }
      this.form.controls['endDate'].updateValueAndValidity();
      this.form.controls['interval'].updateValueAndValidity();
    });

    this.form.controls['dates'].valueChanges.subscribe(dates => {
      this.endDateIsLast = !!dates.every(date => moment(date).isBefore(moment(this.form.value.endDate)));
    });
    this.form.controls['endDate'].valueChanges.subscribe(endDate => {
      this.endDateIsLast = this.form.value.dates.every(date => moment(date).isBefore(moment(endDate)));
    });


    this.timings.controls['startTime'].valueChanges.subscribe(startDate => {
      this.timings.controls['endTime'].setValue(moment(startDate).add('1', 'h').add('30', 'm').toDate());
    })


  }

  onSubmit(values) {
    if (this.form.valid) {
      const vmPoolId = this.vmPools.find(vmPool => vmPool.displayName === values.vmPool).id;
      const interval_dates = [];
      if (values.interval) {
        values.dates.forEach(date => {
          const curr_date = moment(date).add(values.interval, 'd');
          const end_date = moment(values.endDate);
          while (!end_date.isBefore(curr_date)) {
            interval_dates.push(curr_date.format('YYYY-MM-DD'));
            curr_date.add(values.interval, 'd')
          }
        });
      }
      const all_dates = new Set<string>(values.dates.map(date => moment(date).format('YYYY-MM-DD')).concat(interval_dates));
      const start_time = moment(values.startTime).format('HH:MM');
      const end_time = moment(values.endTime).format('HH:MM');

      this.reservationService.requestReservation(new ReservationRequestDto(
        1, // TODO: UserService.getCurrentUser()
        vmPoolId,
        values.courseName,
        values.machinesNumber,
        Array.from(all_dates.values()),
        start_time,
        end_time)).subscribe(
        response => {
          let modalContent = '';
          if (response.daysNotReserved.length > 0) {
            modalContent = 'Selected Virtual Machine Pools are' +
              ' not available on selected dates: ' + response.daysNotReserved.map(date => moment(date).format('YYYY-MM-DD')).join(', ') +
              '. Are You sure want to reserve all othres except mentioned above?';
          } else {
            modalContent = 'Enetered date is available. Are You' +
              ' sure want to reserve this slot?';
          }
          this.alertService.newSmallConfirmModal('Confirm Reservation', modalContent,
            () => {
              this.reservationService.confirmReservation(response.id)
                .subscribe(
                  () => this.form.reset(),
                  () => this.alertService.newSmallAcknowledgeModal('Error', 'Error confirming reservation', null));
            },
            () => {
              return this.reservationService.cancelReservation(response.id).subscribe(null);
            });
        });

    } else {
      ReservationComponent.markFormGroupTouched(this.form);
      this.touchCompleter();
    }
  }

  public static markFormGroupTouched(formGroup: FormGroup) {
    (<any>Object).values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control.controls) {
        if (Array.isArray(control.controls)) {
          control.controls.forEach(c => c.markAsTouched());
        } else {
          control.controls.forEach(c => this.markFormGroupTouched(c));
        }
      }
    });
  }

  private createDate() {
    return new FormControl('', Validators.required)
  }

  removeDate(i: number): void {
    this.dates = this.form.get('dates') as FormArray;
    this.dates.removeAt(i);
  }

  addDate(): void {
    this.dates = this.form.get('dates') as FormArray;
    this.dates.push(this.createDate());
  }
}


class TimingsValidator {
  public static validate(firstField, secondField) {

    return (c: FormGroup) => {

      return (c.controls && moment(c.controls[firstField].value).isBefore(moment(c.controls[secondField].value))) ? null : {
        timingsBefore: {
          valid: false,
        },
      };
    };
  }
}
