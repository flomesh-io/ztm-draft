<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from 'vue-router'
import PipyProxyService from '@/service/PipyProxyService';
import ServiceCreate from './ServiceCreate.vue'
const router = useRouter();
import store from "@/store";
const pipyProxyService = new PipyProxyService();
const meshes = ref([]);
const status = ref({});
const selected = ref(null);
const scopeType = ref('All');
onMounted(() => {
	loaddata();
});

const loaddata = () => {
	pipyProxyService.getMeshes()
		.then(res => {
			meshes.value = res || [];
			meshes.value.forEach((mesh) => {
				mesh.value = mesh.name
			});
			selected.value = meshes.value[0];
		})
		.catch(err => console.log('Request Failed', err)); 
}

const typing = ref('');
const clickSearch = () => {
}
const newHub = () => {
	router.push(`/agent/hub/create`)
}
const clients = () => {
	
	router.push(`/server/clients`)
}
const changeStatus = (hub,val) => {
	status.value[`${hub.host}:${hub.port}`] = val;
}

const active = ref(0);
const save = () => {
	active.value = 0;
	loaddata();
}
</script>

<template>
	<Card class="nopd ml-3 mr-3 mt-3" v-if="active==0">
		<template #content>
			<InputGroup class="search-bar">
				<Dropdown
					v-model="selected" 
					:options="meshes" 
					optionLabel="label" 
					placeholder="Mesh" 
					style="max-width: 200px;"
					class="transparent">
	<!-- 				    <template #optiongroup="slotProps">
									<div class="flex align-items-center">
											<i class="pi pi-star-fill " style="color: orange;"/>
											<div>{{ slotProps.option.label }}</div>
									</div>
							</template> -->
							<template #option="slotProps">
									<div class="flex align-items-center">
											<span class="status-point run mr-3"/>
											<div>{{ decodeURI(slotProps.option.name) }}</div>
									</div>
							</template>
							 <template #value="slotProps">
										<div v-if="slotProps.value" class="flex align-items-center">
												<span class="status-point run mr-3"/>
												<div>{{ decodeURI(slotProps.value.name) }}</div>
										</div>
										<span v-else>
												{{ slotProps.placeholder }}
										</span>
								</template>
					</Dropdown>
				<Textarea @keyup="watchEnter" v-model="typing" :autoResize="true" class="drak-input bg-gray-900 text-white" placeholder="Typing service name | host" rows="1" cols="30" />
				<Button :disabled="!typing" icon="pi pi-search"  @click="clickSearch"/>
			</InputGroup>
		</template>
	</Card>
	
	<div class="text-center mt-3" v-if="active==0">
		
		<Chip class="pl-0 pr-3">
				<span class="bg-primary border-circle w-2rem h-2rem flex align-items-center justify-content-center">
					<RadioButton v-model="scopeType" inputId="scopeType1" name="scopeType" value="All" />
				</span>
				<span class="ml-2 font-medium">All</span>
		</Chip>
		
		<Chip class="ml-2 pl-0 pr-3">
				<span class="bg-primary border-circle w-2rem h-2rem flex align-items-center justify-content-center">
					<RadioButton v-model="scopeType" inputId="scopeType2" name="scopeType" value="Public" />
				</span>
				<span class="ml-2 font-medium">Remote</span>
		</Chip>
		
		<Chip class="ml-2 pl-0 pr-3">
				<span class="bg-primary border-circle w-2rem h-2rem flex align-items-center justify-content-center">
					<RadioButton v-model="scopeType" inputId="scopeType3" name="scopeType" value="Private" />
				</span>
				<span class="ml-2 font-medium">Local</span>
		</Chip>
	</div>
		
	<TabView class="pt-3 pl-3 pr-3" v-model:activeIndex="active">
		<TabPanel>
			<template #header>
				<div @click="loaddata">
					<i class="pi pi-star-fill mr-2" style="color: orange;"/>Services
				</div>
			</template>
			<div class="text-center">
				<div class="grid text-left" v-if="meshes && meshes.length >0">
						<div class="col-12 md:col-6 lg:col-3" v-for="(mesh,hid) in meshes" :key="hid">
							 <div class="surface-card shadow-2 p-3 border-round">
									 <div class="flex justify-content-between mb-3">
											 <div>
														<span class="block text-500 font-medium mb-3">{{decodeURI(mesh.name)}}</span>
														<div class="text-900 font-medium text-xl">Joined</div>
											 </div>
											 <div v-tooltip="'Unsubscribe'" @click="deleteMesh(mesh.name)" class="pointer flex align-items-center justify-content-center bg-orange-100 border-round" style="width: 2.5rem; height: 2.5rem">
													 <i class="pi pi-star-fill text-orange-500 text-xl"></i>
											 </div>
	<!-- 	       								<div v-tooltip="'Revoke'" @click="changeStatus(mesh, 3)" v-else-if="mesh.scope == 'Private'" class="pointer flex align-items-center justify-content-center bg-purple-100 border-round" style="width: 2.5rem; height: 2.5rem">
													<i class="pi pi-spin pi-spinner text-purple-500 text-xl"></i>
											</div> -->
										<!-- 	<div v-badge.danger="'3'" v-tooltip="'Subscriptions'" @click="clients" class="mr-3 pointer flex align-items-center justify-content-center bg-gray-100 border-round" style="width: 2.5rem; height: 2.5rem">
												<i class="pi pi-user text-gray-500 text-xl"></i>
											</div>
											<div v-tooltip="'Manage'" @click="newHub" class="pointer flex align-items-center justify-content-center bg-gray-100 border-round" style="width: 2.5rem; height: 2.5rem">
												<i class="pi pi-pencil text-gray-500 text-xl"></i>
											</div> -->
									 </div>
										<span class="text-500">{{mesh.bootstraps[0]}}</span>
										<span class="text-green-500" v-if="mesh.bootstraps.length>1">... <Badge class="relative" style="top:-2px" :value="mesh.bootstraps.length"></Badge></span>
							 </div>
					 </div>
				</div>
				<img v-else src="/demo/images/landing/free.svg" class="w-5 h-5 mx-aut" style="margin: auto;"  />
			</div>
		</TabPanel>
		<TabPanel >
			<template #header>
				<i class="pi pi-plus mr-2" /> Create
			</template>
			<ServiceCreate :meshes="meshes" v-if="!!selected" :mesh="selected.name?.id" :ep="selected.agent?.id" @save="save"/>
			<div v-else>
				Join a mesh first.
			</div>
		</TabPanel>
	</TabView>
</template>

<style scoped lang="scss">
:deep(.p-dataview-content) {
  background-color: transparent !important;
}
.drak-input{
	border: none;
	min-height: 33px !important;
}
:deep(.p-tabview-nav),
:deep(.p-tabview-panels),
:deep(.p-tabview-nav-link){
	background: transparent !important;
}
</style>