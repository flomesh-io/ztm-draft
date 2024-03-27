<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from 'vue-router'
import PipyProxyService from '@/service/PipyProxyService';
const router = useRouter();
import store from "@/store";
const pipyProxyService = new PipyProxyService();

const hubs = ref([]);
const status = ref({});
const scopeType = ref('All');
onMounted(() => {
	hubs.value = [{
		agent: "中国香港",
		hub: "Dalian Hub",
		host: "192.168.1.1",
		port: "8080",
		scope: "Public",
	},{
		agent: "中国香港",
		hub: "Shanghai Hub",
		host: "192.168.1.1",
		port: "9090",
		scope: "Private",
	}];
});


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
</script>

<template>
	<Card class="nopd ml-3 mr-3 mt-3">
		<template #content>
			<InputGroup>
				<Button :label="scopeType" />
				<Textarea @keyup="watchEnter" v-model="typing" :autoResize="true" class="drak-input bg-gray-900 text-white" placeholder="Typing host | hub | agent" rows="1" cols="30" />
				<Button :disabled="!typing" icon="pi pi-search"  @click="clickSearch"/>
			</InputGroup>
		</template>
	</Card>
	
	<div class="text-center mt-3">
		
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
				<span class="ml-2 font-medium">Public</span>
		</Chip>
		
		<Chip class="ml-2 pl-0 pr-3">
				<span class="bg-primary border-circle w-2rem h-2rem flex align-items-center justify-content-center">
					<RadioButton v-model="scopeType" inputId="scopeType3" name="scopeType" value="Private" />
				</span>
				<span class="ml-2 font-medium">Private</span>
		</Chip>
		<Button @click="newHub" class="ml-5" size="small" aria-label="Filter" style="vertical-align: middle;top:-2px"><i class="pi pi-plus mr-2"/> Create</Button>
	</div>
	<TabView class="pt-3 pl-3 pr-3">
	    <TabPanel header="Market" >
	        <div class="grid">
	            <div class="col-12 md:col-6 lg:col-3" v-for="(hub,hid) in hubs" :key="hid">
	                <div class="surface-card shadow-2 p-3 border-round">
	                    <div class="flex justify-content-between mb-3">
	                        <div>
	                            <span class="block text-500 font-medium mb-3">{{hub.agent}}</span>
	                            <div class="text-900 font-medium text-xl">{{hub.hub}}</div>
	                        </div>
	                        <div v-tooltip="'Unsubscribe'" @click="changeStatus(hub, 1)" v-if="hub.scope == 'Public' && status[`${hub.host}:${hub.port}`] == 2" class="pointer flex align-items-center justify-content-center bg-orange-100 border-round" style="width: 2.5rem; height: 2.5rem">
	                            <i class="pi pi-star-fill text-orange-500 text-xl"></i>
	                        </div>
	                        <div v-tooltip="'Subscribe'" @click="changeStatus(hub, 2)" v-else-if="hub.scope == 'Public'" class="pointer flex align-items-center justify-content-center bg-orange-100 border-round" style="width: 2.5rem; height: 2.5rem">
	                            <i class="pi pi-star text-orange-500 text-xl"></i>
	                        </div>
													<div v-tooltip="'Revoke'" @click="changeStatus(hub, 3)" v-else-if="hub.scope == 'Private' && status[`${hub.host}:${hub.port}`] == 4" class="pointer flex align-items-center justify-content-center bg-purple-100 border-round" style="width: 2.5rem; height: 2.5rem">
													    <i class="pi pi-spin pi-spinner text-purple-500 text-xl"></i>
													</div>
													<div v-tooltip="'Application'" @click="changeStatus(hub, 4)" v-else-if="hub.scope == 'Private'" class="pointer flex align-items-center justify-content-center bg-purple-100 border-round" style="width: 2.5rem; height: 2.5rem">
													    <i class="pi pi-angle-double-up text-purple-500 text-xl"></i>
													</div>
	                    </div>
	                    <span class="text-500">{{hub.host}}:{{hub.port}}</span> | 
											<span class="text-green-500">{{hub.scope}}</span>
	                </div>
	            </div>
	        </div>
	    </TabPanel>
	    <TabPanel >
				<template #header>
					<i class="pi pi-star-fill mr-2" style="color: orange;"/>My Subscriptions
				</template>
	       <div class="grid">
	           <div class="col-12 md:col-6 lg:col-3" v-for="(hub,hid) in hubs" :key="hid">
	               <div class="surface-card shadow-2 p-3 border-round">
	                   <div class="flex justify-content-between mb-3">
	                       <div>
	                            <span class="block text-500 font-medium mb-3">{{hub.agent}}</span>
	                            <div class="text-900 font-medium text-xl">{{hub.hub}}</div>
	                       </div>
	                       <div v-tooltip="'Unsubscribe'" @click="changeStatus(hub, 1)" v-if="hub.scope == 'Public'" class="pointer flex align-items-center justify-content-center bg-orange-100 border-round" style="width: 2.5rem; height: 2.5rem">
	                           <i class="pi pi-star-fill text-orange-500 text-xl"></i>
	                       </div>
	       								<div v-tooltip="'Revoke'" @click="changeStatus(hub, 3)" v-else-if="hub.scope == 'Private'" class="pointer flex align-items-center justify-content-center bg-purple-100 border-round" style="width: 2.5rem; height: 2.5rem">
	       								    <i class="pi pi-spin pi-spinner text-purple-500 text-xl"></i>
	       								</div>
	                   </div>
	                    <span class="text-500">{{hub.host}}:{{hub.port}}</span> | 
											<span class="text-green-500">{{hub.scope}}</span>
	               </div>
	           </div>
	       </div>
	    </TabPanel>
	    <TabPanel >
				<template #header>
					<i class="pi pi-wrench mr-2" />Manage
				</template>
	       <div class="grid">
	           <div class="col-12 md:col-6 lg:col-3" v-for="(hub,hid) in hubs" :key="hid">
	               <div class="surface-card shadow-2 p-3 border-round">
	                   <div class="flex justify-content-between mb-3">
	                       <div>
	                            <span class="block text-500 font-medium mb-3">{{hub.agent}}</span>
	                            <div class="text-900 font-medium text-xl">{{hub.hub}}</div>
	                       </div>
												 <div class="flex">
													 <div v-badge.danger="'3'" v-tooltip="'Subscriptions'" @click="clients" class="mr-3 pointer flex align-items-center justify-content-center bg-gray-100 border-round" style="width: 2.5rem; height: 2.5rem">
															 <i class="pi pi-user text-gray-500 text-xl"></i>
													 </div>
													 <div v-tooltip="'Manage'" @click="newHub" class="pointer flex align-items-center justify-content-center bg-gray-100 border-round" style="width: 2.5rem; height: 2.5rem">
															 <i class="pi pi-pencil text-gray-500 text-xl"></i>
													 </div>
												 </div>
	                   </div>
	                    <span class="text-500">{{hub.host}}:{{hub.port}}</span> | 
											<span class="text-green-500">{{hub.scope}}</span>
	               </div>
	           </div>
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