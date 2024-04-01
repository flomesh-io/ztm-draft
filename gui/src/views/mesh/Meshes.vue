<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from 'vue-router'
import PipyProxyService from '@/service/PipyProxyService';
import MeshJoin from './MeshJoin.vue';
import { useConfirm } from "primevue/useconfirm";
import store from "@/store";
const router = useRouter();
const confirm = useConfirm();
const pipyProxyService = new PipyProxyService();
const meshes = ref([]);
const status = ref({});
const scopeType = ref('All');
onMounted(() => {
	loaddata();
});
const loading = ref(false);
const loaddata = () => {
	loading.value = true;
	pipyProxyService.getMeshes()
		.then(res => {
			console.log(res);
			loading.value = false;
			meshes.value = res;
		})
		.catch(err => console.log('Request Failed', err)); 
}
const deleteMesh = (name) => {
	confirm.require({
	    message: `Are you sure to exit ${decodeURI(name)} ?`,
	    header: 'Tips',
	    icon: 'pi pi-exclamation-triangle',
	    accept: () => {
				pipyProxyService.deleteMesh(name)
					.then(res => {
						console.log(res);
						loaddata();
					})
					.catch(err => console.log('Request Failed', err)); 
	    },
	    reject: () => {
	    }
	});
	
}
const changeStatus = (mesh,val) => {
	status.value[`${mesh.host}:${mesh.port}`] = val;
}
const active = ref(0);
const join = () => {
	active.value = 0;
	loaddata();
}
</script>

<template>
	
	<TabView class="pt-3 pl-3 pr-3" v-model:activeIndex="active">
	    <TabPanel>
				<template #header>
					<div @click="loaddata">
						<i class="pi pi-star-fill mr-2" style="color: orange;"/>My Meshes
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
					<i class="pi pi-plus mr-2" /> Join
				</template>
	      <MeshJoin @join="join"/>
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