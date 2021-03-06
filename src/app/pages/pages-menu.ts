import { NbMenuItem } from '@nebular/theme';

export const MENU_ITEMS: NbMenuItem[] = [
  {
    title: 'Virtual Machines',
    icon: 'nb-list',
    link: '/pages/virtual-machines',
    home: true,
  },
  {
    title: 'Reservation',
    icon: 'nb-compose',
    link: '/pages/reservation',
  },
  {
    title: 'Statistics',
    icon: 'nb-bar-chart',
    link: '/pages/stats',
  },
  {
    title: 'FEATURES',
    group: true,
  },
  {
    title: 'Auth',
    icon: 'nb-locked',
    children: [
      {
        title: 'Login',
        link: '/auth/login',
      },
      {
        title: 'Register',
        link: '/auth/register',
      },
      {
        title: 'Request Password',
        link: '/auth/request-password',
      },
      {
        title: 'Reset Password',
        link: '/auth/reset-password',
      },
    ],
  },
];
