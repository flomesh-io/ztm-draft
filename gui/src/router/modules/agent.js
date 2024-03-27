const agent = {
  path: "agent",
  name: "Agent",
	redirect: "/agent/hub/list",
  children: [
		{
				path: '/agent/hub/list',
				name: 'hubs',
				component: () => import('@/views/agent/Hubs.vue')
		},
		{
				path: '/agent/hub/create',
				name: 'hub detail',
				component: () => import('@/views/agent/HubDetail.vue')
		},
  ],
};

export default agent;
