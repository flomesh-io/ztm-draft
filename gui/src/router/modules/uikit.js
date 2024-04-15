const uikit = {
  path: "uikit",
  name: "Uikit",
	redirect: "/uikit/formlayout",
  children: [
    {
        path: '/uikit/formlayout',
        name: 'formlayout',
        component: () => import('@/views/uikit/FormLayout.vue')
    },
    {
        path: '/uikit/input',
        name: 'input',
        component: () => import('@/views/uikit/Input.vue')
    },
    {
        path: '/uikit/floatlabel',
        name: 'floatlabel',
        component: () => import('@/views/uikit/FloatLabel.vue')
    },
    {
        path: '/uikit/invalidstate',
        name: 'invalidstate',
        component: () => import('@/views/uikit/InvalidState.vue')
    },
    {
        path: '/uikit/button',
        name: 'button',
        component: () => import('@/views/uikit/Button.vue')
    },
    {
        path: '/uikit/table',
        name: 'table',
        component: () => import('@/views/uikit/Table.vue')
    },
    {
        path: '/uikit/list',
        name: 'list',
        component: () => import('@/views/uikit/List.vue')
    },
    {
        path: '/uikit/tree',
        name: 'tree',
        component: () => import('@/views/uikit/Tree.vue')
    },
    {
        path: '/uikit/panel',
        name: 'panel',
        component: () => import('@/views/uikit/Panels.vue')
    },
    
    {
        path: '/uikit/overlay',
        name: 'overlay',
        component: () => import('@/views/uikit/Overlay.vue')
    },
    {
        path: '/uikit/media',
        name: 'media',
        component: () => import('@/views/uikit/Media.vue')
    },
    {
        path: '/uikit/menu',
        component: () => import('@/views/uikit/Menu.vue'),
        children: [
            {
                path: '/uikit/menu/personal',
                component: () => import('@/views/uikit/menu/PersonalDemo.vue')
            },
            {
                path: '/uikit/menu/seat',
                component: () => import('@/views/uikit/menu/SeatDemo.vue')
            },
            {
                path: '/uikit/menu/payment',
                component: () => import('@/views/uikit/menu/PaymentDemo.vue')
            },
            {
                path: '/uikit/menu/confirmation',
                component: () => import('@/views/uikit/menu/ConfirmationDemo.vue')
            }
        ]
    },
    {
        path: '/uikit/message',
        name: 'message',
        component: () => import('@/views/uikit/Messages.vue')
    },
    {
        path: '/uikit/file',
        name: 'file',
        component: () => import('@/views/uikit/File.vue')
    },
    {
        path: '/uikit/charts',
        name: 'charts',
        component: () => import('@/views/uikit/Chart.vue')
    },
    {
        path: '/uikit/misc',
        name: 'misc',
        component: () => import('@/views/uikit/Misc.vue')
    },
  ],
};

export default uikit;
