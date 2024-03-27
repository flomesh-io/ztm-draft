<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { removeAuthorization, AUTH_TYPE } from "@/service/common/request";
import { useLayout } from '@/layout/composables/layout';
import { useRouter } from 'vue-router';
import AppSmallMenu from './AppSmallMenu.vue';
import store from "@/store";
import XeyeSvg from "@/assets/img/white.png";
import HoverXeyeSvg from "@/assets/img/logo.png";
import { useConfirm } from "primevue/useconfirm";
import PipyProxyService from '@/service/PipyProxyService';

const confirm = useConfirm();
const emits = defineEmits(['collapse']);

const router = useRouter();
const pipyProxyService = new PipyProxyService();
const selectedGateway = ref(null);
const gateways = ref([]);

onMounted(() => {
	pipyProxyService.getMyGateways()
		.then(res => {
			gateways.value = res?.data;
		})
		.catch(err => console.log('Request Failed', err)); 
});

onBeforeUnmount(() => {
});

const logout = () => {
    confirm.require({
        message: 'Are you sure you want to exit?',
        header: 'Logout',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
					removeAuthorization(AUTH_TYPE.BASIC);
					store.commit('account/setUser', null);
          router.push('/login');
        },
        reject: () => {
            
        }
    });
};
const logoHover = ref(false);
const clickCollapse = (path) => {
	emits('collapse',false);
	router.push(path)
}
const playing = ref(false);
const play = () => {
	playing.value = !playing.value
}
</script>

<template>
	<div class="e-card playing">
	  <div class="image"></div>
	  
	  <div class="wave"></div>
	  <div class="wave"></div>
	  <div class="wave"></div>
			<div class="infotop">
				<div>
					<img :class="{'spiner': playing}" class="logo pointer " @mouseleave="logoHover = false" @mouseover="logoHover = true" :src="logoHover?HoverXeyeSvg:XeyeSvg" height="60"/>
				</div>
				<div>
					
				</div>
			<div>
				<Dropdown 
				v-model="selectedGateway" 
				:options="gateways" 
				optionLabel="label" 
				placeholder="Select a Hub" 
				class="w-20rem mt-4 gateway-selector">
<!-- 				    <template #optiongroup="slotProps">
				        <div class="flex align-items-center">
										<i class="pi pi-star-fill " style="color: orange;"/>
				            <div>{{ slotProps.option.label }}</div>
				        </div>
				    </template> -->
				    <template #option="slotProps">
				        <div class="flex align-items-center">
										<i class="pi pi-star-fill mr-2" style="color: orange;"/>
				            <div>{{ slotProps.option.label }}</div>
				        </div>
				    </template>
						 <template #value="slotProps">
									<div v-if="slotProps.value" class="flex align-items-center">
											<i class="pi pi-star-fill mr-2" style="color: orange;"/>
											<div>{{ slotProps.value.label }}</div>
									</div>
									<span v-else>
											{{ slotProps.placeholder }}
									</span>
							</template>
				</Dropdown>
				
			</div>
	
			<div class="name">
				
			</div>
	  </div>
		<div class="footer">
			<div class="flex-item">
				<Button v-tooltip="'Logout'" class="pointer" severity="help" text rounded aria-label="Filter" @click="logout" >
					<i class="pi pi-power-off " />
				</Button>
			</div>
			
			<div class="flex-item">
				<Button v-tooltip="'Config'" class="pointer" severity="help" text rounded aria-label="Filter" @click="clickCollapse('/client/config')" >
					<i class="pi pi-cog " />
				</Button>
			</div>
			<div class="flex-item">
				<Button v-tooltip="'Find Hub'" class="pointer" severity="help" text rounded aria-label="Filter" @click="clickCollapse('/agent/hub/list')" >
					<i class="pi pi-search " />
				</Button>
			</div>
			<div class="flex-item">
				<Button :disabled="!selectedGateway" v-tooltip.left="'Start'" v-if="!playing" class="pointer" severity="help" text rounded aria-label="Filter" @click="play" >
					<i class="pi pi-play " />
				</Button>
				<Button v-tooltip="'Pause'"  v-else class="pointer" severity="help" text rounded aria-label="Filter" @click="play" >
					<i class="pi pi-stop-circle" />
				</Button>
			</div>
		</div>
	</div>
<!-- 	<div class="flex">
		
		<div class="flex-item">
			
			
		</div>
		<div>
		
			<AppSmallMenu />
		</div>
	</div> -->
	<ConfirmDialog></ConfirmDialog>
</template>

<style lang="scss" scoped>
	.logo{
		opacity: 0.7;
	}
	.footer .pi{
		font-size: 26px;
		color: rgba(255, 255, 255, 0.9);
		transition: .3s all;
		margin: auto;
	}
	:deep(.footer .p-button){
		width: 46px;
		height: 46px;
		padding: 0;
		text-align: center;
	}
	.pi-cog:hover{
	}
	.e-card {
	  background: transparent;
	  box-shadow: 0px 8px 28px -9px rgba(0,0,0,0.45);
	  position: relative;
	  width: 455px;
	  height: 322px;
	  border-radius: 0px;
	  overflow: hidden;
	}
	.e-card .footer{
		display: flex;
		justify-content: center;
		align-items: center;
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 60px;
		background-color: rgba(255, 255, 255, 0.4);
	}
	.e-card .footer{
		padding-bottom: 12px;
		padding-top: 10px;
	}
	.e-card .footer .flex-item{
		text-align: center;
		height: 46px;
		line-height: 46px;
	}
	.e-card .footer .flex-item:not(:first-child){
		border-left:1px dashed rgba(255, 255, 255, 0.3);
	}
	.wave {
	  position: absolute;
	  width: 1200px;
	  height: 1200px;
	  opacity: 0.6;
	  left: 0;
	  top: 0;
	  margin-left: -90%;
	  margin-top: -30%;
	  background: linear-gradient(744deg,#af40ff,#5b42f3 60%,#00ddeb);
	}
	
	.icon {
	  width: 3em;
	  margin-top: -1em;
	  padding-bottom: 1em;
	}
	
	.infotop {
	  text-align: center;
	  font-size: 20px;
	  position: absolute;
	  top: 3.6em;
	  left: 0;
	  right: 0;
	  color: rgb(255, 255, 255);
	  font-weight: 600;
	}
	
	.name {
	  font-size: 14px;
	  font-weight: 100;
	  position: relative;
	  top: 1em;
	  text-transform: lowercase;
	}
	
	.wave:nth-child(2),
	.wave:nth-child(3) {
	  top: 210px;
	}
	
	.playing .wave {
	  border-radius: 40%;
	  animation: wave 3000ms infinite linear;
	}
	
	.wave {
	  border-radius: 40%;
	  animation: wave 55s infinite linear;
	}
	
	.playing .wave:nth-child(2) {
	  animation-duration: 4000ms;
	}
	
	.wave:nth-child(2) {
	  animation-duration: 50s;
	}
	
	.playing .wave:nth-child(3) {
	  animation-duration: 5000ms;
	}
	
	.wave:nth-child(3) {
	  animation-duration: 45s;
	}
	
	@keyframes wave {
	  0% {
	    transform: rotate(0deg);
	  }
	
	  100% {
	    transform: rotate(360deg);
	  }
	}
	.gateway-selector{
		border-width: 4px;
		background-color: rgba(255, 255, 255, 0.2);
		color: #fff;
		border-color:rgba(255,255,255,0.5);
	}
	:deep(.gateway-selector .p-dropdown-label){
		color: rgba(255,255,255,0.9);
		font-weight: bold;
	}
	:deep(.gateway-selector .p-dropdown-label.p-placeholder){
		color: rgba(255,255,255,0.5) !important;
		font-weight: bold;
	}
</style>
