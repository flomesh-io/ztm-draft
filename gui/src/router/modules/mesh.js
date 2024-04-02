const agent = {
  path: "mesh",
  name: "Mesh",
	redirect: "/mesh/list",
  children: [
		{
				path: '/mesh/list',
				name: 'meshes',
				component: () => import('@/views/mesh/Meshes.vue')
		},
		{
				path: '/mesh/services',
				name: 'services',
				component: () => import('@/views/mesh/Services.vue')
		},
		// {
		// 		path: '/agent/hub/create',
		// 		name: 'hub detail',
		// 		component: () => import('@/views/agent/HubDetail.vue')
		// },
  ],
};

export default agent;
