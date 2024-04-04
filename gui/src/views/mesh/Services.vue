<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from 'vue-router'
import PipyProxyService from '@/service/PipyProxyService';
import ServiceCreate from './ServiceCreate.vue'
import MeshSelector from './common/MeshSelector.vue'
import PortMaping from './PortMaping.vue'
import { useConfirm } from "primevue/useconfirm";
const confirm = useConfirm();
const router = useRouter();
import store from "@/store";
const pipyProxyService = new PipyProxyService();
const services = ref([]);
const status = ref({});
const scopeType = ref('All');

const meshes = ref([]);
const selectedMesh = ref(null);
const loading = ref(false);
const load = (d) => {
	meshes.value = d;
}
const select = (selected) => {
	selectedMesh.value = selected;
	getServices();
}

const deleteService = (service) => {
	confirm.require({
	    message: `Are you sure to delete ${service.name} service?`,
	    header: 'Tips',
	    icon: 'pi pi-exclamation-triangle',
	    accept: () => {
				pipyProxyService.deleteService({
					name: service.name,
					proto: service.protocol,
					mesh:selectedMesh.value?.name,
					ep:selectedMesh.value.agent?.id,
				})
					.then(res => {
						getServices();
					})
					.catch(err => console.log('Request Failed', err)); 
	    },
	    reject: () => {
	    }
	});
	
}
const getServices = () => {
	active.value = 0;
	loading.value = true;
	if(!!selectedMesh.value){
		pipyProxyService.getServices({
			mesh:selectedMesh.value?.name
		})
			.then(res => {
				console.log("services:")
				console.log(res)
				loading.value = false;
				services.value = res || [];
			})
			.catch(err => console.log('Request Failed', err)); 
	}
}

const servicesFilter = computed(() => {
	return services.value.filter((svc)=>{
		return (typing.value == '' || typing.value == svc.name || typing.value == svc.host) 
		&& (scopeType.value == 'All' || (scopeType.value == 'Remote' && !svc.isLocal) || (scopeType.value == 'Local' && !!svc.isLocal))
	})
});


const servicesLb = computed(() => {
	const lbMap = {};
	services.value.forEach((svc)=>{
		if(!lbMap[svc.name]){
			lbMap[svc.name] = [];
		}
		lbMap[svc.name].push(svc);
	});
	return Object.values(lbMap);
});

const typing = ref('');
const clickSearch = () => {
}

const active = ref(0);
const save = () => {
	active.value = 0;
	getServices();
}
const visiblePort = ref(false)
const selectedService = ref(null);
const mappingPort = ({service, ep}) => {
	visiblePort.value = true;
	selectedService.value = {service, ep};
}
const savePort = () => {
	visiblePort.value = false;
}
</script>

<template>
	<Card class="nopd ml-3 mr-3 mt-3">
		<template #content>
			<InputGroup class="search-bar" v-if="active!=2">
				<MeshSelector 
					v-if="active!=2" 
					:full="false" 
					innerClass="transparent" 
					@load="load" 
					@select="select"/>
				<Textarea @keyup="watchEnter" v-model="typing" :autoResize="true" class="drak-input bg-gray-900 text-white" placeholder="Typing service name | host" rows="1" cols="30" />
				<Button :disabled="!typing" icon="pi pi-search"  @click="clickSearch"/>
			</InputGroup>
		</template>
	</Card>
		
	<Loading v-if="loading"/>
	<TabView v-else class="pt-3 pl-3 pr-3" v-model:activeIndex="active">
		<TabPanel>
			<template #header>
				<div @click="getServices">
					<i class="pi pi-server mr-2"/>Services
				</div>
			</template>
			<div class="text-center">
				<div class="mt-1 mb-2" >
					
					<Chip class="pl-0 pr-3">
							<span class="bg-primary border-circle w-2rem h-2rem flex align-items-center justify-content-center">
								<RadioButton v-model="scopeType" inputId="scopeType1" name="scopeType" value="All" />
							</span>
							<span class="ml-2 font-medium">All</span>
					</Chip>
					
					<Chip class="ml-2 pl-0 pr-3">
							<span class="bg-primary border-circle w-2rem h-2rem flex align-items-center justify-content-center">
								<RadioButton v-model="scopeType" inputId="scopeType2" name="scopeType" value="Remote" />
							</span>
							<span class="ml-2 font-medium">Remote</span>
					</Chip>
					
					<Chip class="ml-2 pl-0 pr-3">
							<span class="bg-primary border-circle w-2rem h-2rem flex align-items-center justify-content-center">
								<RadioButton v-model="scopeType" inputId="scopeType3" name="scopeType" value="Local" />
							</span>
							<span class="ml-2 font-medium">Local</span>
					</Chip>
				</div>
				<div class="grid text-left" v-if="servicesFilter && servicesFilter.length >0">
						<div class="col-12 md:col-6 lg:col-3" v-for="(service,hid) in servicesFilter" :key="hid">
							 <div class="surface-card shadow-2 p-3 border-round">
									 <div class="flex justify-content-between mb-3">
											 <div>
														<span class="block text-500 font-medium mb-3">{{service.isLocal?'Local':'Remote'}}</span>
														<div class="text-900 font-medium text-xl">{{decodeURI(service.name)}}</div>
											 </div>
											 <div class="flex">
												 <div v-tooltip="'Mapping Port'" @click="mappingPort({service: service.name,ep:selectedMesh.agent})" class="pointer flex align-items-center justify-content-center bg-primary-100 border-round mr-2" style="width: 2.5rem; height: 2.5rem">
														 <i class="pi pi-circle text-primary-500 text-xl"></i>
												 </div>
												 <div v-tooltip="'Delete'" @click="deleteService(service)" class="pointer flex align-items-center justify-content-center bg-gray-100 border-round" style="width: 2.5rem; height: 2.5rem">
														 <i class="pi pi-trash text-gray-500 text-xl"></i>
												 </div>
											 </div>
	<!-- 	       								<div v-tooltip="'Revoke'" @click="changeStatus(service, 3)" v-else-if="service.scope == 'Private'" class="pointer flex align-items-center justify-content-center bg-purple-100 border-round" style="width: 2.5rem; height: 2.5rem">
													<i class="pi pi-spin pi-spinner text-purple-500 text-xl"></i>
											</div> -->
										<!-- 	<div v-badge.danger="'3'" v-tooltip="'Subscriptions'" @click="clients" class="mr-3 pointer flex align-items-center justify-content-center bg-gray-100 border-round" style="width: 2.5rem; height: 2.5rem">
												<i class="pi pi-user text-gray-500 text-xl"></i>
											</div>
											<div v-tooltip="'Manage'" @click="newHub" class="pointer flex align-items-center justify-content-center bg-gray-100 border-round" style="width: 2.5rem; height: 2.5rem">
												<i class="pi pi-pencil text-gray-500 text-xl"></i>
											</div> -->
									 </div>
										<span class="text-500"><Tag severity="warning" :value="service.protocol" class="mr-1"></Tag> {{service.host}}{{!!service.port?(`:${service.port}`):''}}</span>
							 </div>
					 </div>
				</div>
				<img v-else src="/demo/images/landing/free.svg" class="w-5 h-5 mx-aut" style="margin: auto;"  />
			</div>
		</TabPanel>
		<TabPanel>
			<template #header>
				<div @click="loaddata">
					<i class="pi pi-sitemap mr-2" />Services Lb
				</div>
			</template>
			<div class="text-center">
				
	
				<div class="grid text-left" v-if="servicesLb && servicesLb.length >0">
						<div class="col-12 md:col-6 lg:col-3" v-for="(lb,hid) in servicesLb" :key="hid">
							 <div class="surface-card shadow-2 p-3 border-round">
									 <div class="flex justify-content-between mb-3">
											 <div>
													<span class="block text-500 font-medium mb-3"><i class="pi pi-server text-gray-500"></i> {{lb[0].name}}</span>
											 </div>
											 <div class="flex">
												 <div v-tooltip="'Mapping Port'"  @click="mappingPort({service: lb[0].name})" class="pointer flex align-items-center justify-content-center bg-primary-100 border-round mr-2" style="width: 2.5rem; height: 2.5rem">
														 <i class="pi pi-bullseye text-primary-500 text-xl"></i>
												 </div>
											 </div>
	<!-- 	       								<div v-tooltip="'Revoke'" @click="changeStatus(service, 3)" v-else-if="service.scope == 'Private'" class="pointer flex align-items-center justify-content-center bg-purple-100 border-round" style="width: 2.5rem; height: 2.5rem">
													<i class="pi pi-spin pi-spinner text-purple-500 text-xl"></i>
											</div> -->
										<!-- 	<div v-badge.danger="'3'" v-tooltip="'Subscriptions'" @click="clients" class="mr-3 pointer flex align-items-center justify-content-center bg-gray-100 border-round" style="width: 2.5rem; height: 2.5rem">
												<i class="pi pi-user text-gray-500 text-xl"></i>
											</div>
											<div v-tooltip="'Manage'" @click="newHub" class="pointer flex align-items-center justify-content-center bg-gray-100 border-round" style="width: 2.5rem; height: 2.5rem">
												<i class="pi pi-pencil text-gray-500 text-xl"></i>
											</div> -->
									 </div>
										<Fieldset :legend="lb.length+ (lb.length>1?' Endpoints':' Endpoint')" :toggleable="true">
											<div class="surface-card p-3 border-round">
												<div v-for="(service, sid) in lb" :key="sid" class="flex justify-content-between mb-3">
													<span class="status-point run mr-3"/> 
													<span class="text-500 relative" style="top: -5px;"><Tag severity="warning" :value="service.protocol" class="mr-1 relative" style="top: -1px;"></Tag> {{service.host}}{{!!service.port?(`:${service.port}`):''}}</span>
												</div>
											</div>
										</Fieldset>
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
			<ServiceCreate v-if="!!meshes && meshes.length>0" @save="save"/>
			<div v-else>
				Join a mesh first.
			</div>
		</TabPanel>
	</TabView>
	<Dialog 
		v-if="selectedMesh" 
		:showHeader="false" 
		class="nopd transparent"
		v-model:visible="visiblePort" 
		modal 
		:style="{ width: '100%', maxWidth: '500px', padding: 0 }"
		>
		<PortMaping @save="savePort" :mesh="selectedMesh?.name" :endpoint="selectedMesh.agent?.id" :service="selectedService?.service" :targetEndpoint="selectedService?.ep"/>
	</Dialog>
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