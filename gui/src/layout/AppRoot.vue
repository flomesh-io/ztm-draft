<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import store from "@/store";
import { removeAuthorization, AUTH_TYPE } from "@/service/common/request";
import { useLayout } from '@/layout/composables/layout';
import { useRouter } from 'vue-router';
import PipyVersion from './PipyVersion.vue';
import XeyeSvg from "@/assets/img/white.png";
import HoverXeyeSvg from "@/assets/img/logo.png";
import PipySvg from "@/assets/img/pipy-white.png";
import { useConfirm } from "primevue/useconfirm";
import PipyProxyService from '@/service/PipyProxyService';
import { checkAuthorization } from "@/service/common/request";
import { isAdmin } from "@/service/common/authority-utils";
import { Command } from '@tauri-apps/plugin-shell';

const confirm = useConfirm();
const emits = defineEmits(['collapse']);

const router = useRouter();
const pipyProxyService = new PipyProxyService();
const selectedGateway = ref(null);
const gateways = ref([]);

const isLogined = computed(() => {
	return store.getters['account/user']
});
const user = computed(() => {
	return store.getters['account/user'];
});
onMounted(() => {
	pipyInit();
});

onBeforeUnmount(() => {
});
const loaddata = () => {
	pipyProxyService.getMyGateways()
		.then(res => {
			playing.value = true;
			gateways.value = res?.data;
			if(gateways.value!=null && gateways.value.length ==0){
				
				gateways.value = [
					{ label: 'Dalian Hub', value: 'Dalian' },
					{ label: 'Beijing Hub', value: 'Beijing' },
					{ label: 'Shanghai Hub', value: 'Shanghai' }
				]
			}
		})
		.catch(err => console.log('Request Failed', err)); 
}
const pipyRun = ref(false);
const pipyVersion = ref('');
const playing = ref(false);
const play = () => {
	pipyPlay();
}

const getPort = () => {
	return import.meta.env.VITE_APP_API_PORT;
}

const pipyInit = async (pause) => {
	await startPipy();
	setTimeout(() => {
		loaddata();
	},300)
}
const pipyPlay = async () => {
	await startPipy();
	setTimeout(() => {
		loaddata();
	},300)
}

let child = null;
const startPipy = async () => {
	console.log('[starting pipy]');
	if(!!child){
		child.kill();
		child = null;
	}
	const command = Command.create('pipy', ['../../agent/main.js']);
	command.on('close', data => {
	  console.log(`pipy pause with code ${data.code} and signal ${data.signal}`)
	});
	command.on('error', error => console.error(`command error: "${error}"`));
	child = await command.spawn();
}
const pausePipy = async () => {
	if(!!child){
		child.kill();
		child = null;
	}
	playing.value = false;
	console.log('[paused pipy]');
}
const clickPause = () => {
	pausePipy();
}

const logout = () => {
    confirm.require({
        message: 'Are you sure you want to exit?',
        header: 'Logout',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
					removeAuthorization(AUTH_TYPE.BASIC);
					store.commit('account/setUser', null);
          // router.push('/login');
        },
        reject: () => {
            
        }
    });
};
const configOpen = ref(false);
const logoHover = ref(false);
const config = ref({
	port: getPort()
});
const clickCollapse = (path) => {
	router.push(path)
}
const goLogin = () => {
	router.push('/login');
}
const goConfig = () => {
	router.push(isAdmin()?'/server/config':'/client/config');
}

const restart = ref(false);
</script>

<template>
	<div class="e-card playing transparent-form" :class="{'blur': configOpen}">
	  <div class="image"></div>
	  
	  <div class="wave"></div>
	  <div class="wave"></div>
	  <div class="wave"></div>
		<PipyVersion class="left-fixed"/>
		<div class="userinfo" v-if="user">
			<Avatar icon="pi pi-user" style="background-color: rgba(255, 255, 2555, 0.5);color: #fff" shape="circle" />
			{{user?.id}}
		</div>
		<div class="infotop">
			<div>
				<img :class="{'spiner': playing,'bling2':!playing}" class="logo pointer " @mouseleave="logoHover = false" @mouseover="logoHover = true" :src="logoHover?HoverXeyeSvg:XeyeSvg" height="60"/>
			</div>
			<div>
				
			</div>
			<div class="mt-4">
				<Button v-if="!isLogined" class="w-20rem" @click="goLogin">Login</Button>
				<Dropdown 
				v-else
				v-model="selectedGateway" 
				:options="gateways" 
				optionLabel="label" 
				placeholder="Mesh List" 
				class="w-20rem transparent">
<!-- 				    <template #optiongroup="slotProps">
				        <div class="flex align-items-center">
										<i class="pi pi-star-fill " style="color: orange;"/>
				            <div>{{ slotProps.option.label }}</div>
				        </div>
				    </template> -->
				    <template #option="slotProps">
				        <div class="flex align-items-center">
										<span class="status-point run mr-3"/>
				            <div>{{ slotProps.option.label }}</div>
				        </div>
				    </template>
						 <template #value="slotProps">
									<div v-if="slotProps.value" class="flex align-items-center">
											<span class="status-point run mr-3"/>
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
<!-- 			<div v-if="isLogined" class="flex-item">
				<Button  v-tooltip="'Logout'" class="pointer" severity="help" text rounded aria-label="Filter" @click="logout" >
					<i class="pi pi-power-off " />
				</Button>
			</div> -->
			
			<div class="flex-item">
				<Button v-tooltip="'Config'" class="pointer" severity="help" rounded text aria-label="Filter" @click="() => configOpen = true" >
					<i class="pi pi-cog "  />
				</Button>
			</div>
			<div class="flex-item">
				<Button :disabled="!isLogined" v-tooltip="'Find Hub'" class="pointer" severity="help" text rounded aria-label="Filter" @click="clickCollapse('/agent/hub/list')" >
					<i class="pi pi-search " />
				</Button>
			</div>
			<div class="flex-item">
				<Button v-tooltip.left="'Start'" v-if="!playing" class="pointer" severity="help" text rounded aria-label="Filter" @click="play" >
					<i class="pi pi-play " />
				</Button>
				<Button v-tooltip="'Pause'"  v-else class="pointer" severity="help" text rounded aria-label="Filter" @click="clickPause" >
					<i class="pi pi-stop-circle" />
				</Button>
			</div>
		</div>
	</div>
	<div class="config-pannel transparent-form" v-if="configOpen">
		<div class="config-body" >
			<Button  v-tooltip.left="'Close'" class="pointer close" severity="help" text rounded aria-label="Filter" @click="() => configOpen = false" >
				<i class="pi pi-times " />
			</Button>
			<div>
				<!-- <div class="text-500 mb-5">xxx</div> -->
				<ul class="list-none p-0 m-0">
					
					<li class="flex align-items-center py-3 px-2  border-bottom-1 surface-border flex-wrap">
						<div class="font-medium font-bold w-3">Version</div>
						<PipyVersion />
					</li>
					<li class="flex align-items-center py-3 px-2 border-bottom-1 surface-border flex-wrap">
							<div class="font-medium font-bold w-3">Port</div>
							<div class="">
									<InputNumber :useGrouping="false" style="width: 80px;" :min="0" :max="65535" placeholder="0-65535" v-model="config.port" />
							
							</div>
					</li>
					<li v-if="!!isLogined" class="flex align-items-center py-3 px-2 surface-border flex-wrap">
							<div class="font-medium font-bold w-3">More</div>
							<div class="">
								<Button  class="w-12rem" @click="goConfig">Go Console <i class="pi pi-arrow-right ml-2"></i></Button>
							</div>
					</li>
				</ul>
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
	.log{
		opacity: 0.8;
	}
	.bling2{
		-webkit-animation: bling2 2s infinite linear;
		animation: bling2 2s infinite linear
	}
	.userinfo{
		position: absolute;
		top: 10px;
		right: 15px;
		color: rgba(255,255,255,0.7);
		font-weight: bold;
	}
	.userinfo .p-avatar{
		vertical-align: middle;
		transform: scale(0.7);
	}
	.footer .pi{
		font-size: 26px;
		color: rgba(255, 255, 255, 0.9);
		transition: .3s all;
		margin: auto;
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
	.e-card.blur{
		filter: blur(10px);
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
	  width: 1400px;
	  height: 1400px;
	  opacity: 0.6;
	  left: 0;
	  top: 0;
	  margin-left: -115%;
	  margin-top: -20%;
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
	
	
	:deep(.footer .p-button){
		width: 46px;
		height: 46px;
		padding: 0;
		text-align: center;
	}
	
	.left-fixed{
		position: absolute;
		left: 15px;
		top: 12px;
	}
	.config-pannel{
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
	}
	.config-body{
		position: relative;
		padding: 2rem;
		color: rgba(255, 255, 255, 0.9);
	}
	.config-pannel:before {
	  content: "";
	  position: absolute;
	  top: 0;
	  left: 0;
	  right: 0;
	  bottom: 0;
	  background-color: rgba(175, 151, 251, 0.5);
	  backdrop-filter: blur(10px);
	}
	.config-body .close{
		position: absolute;
		right: 15px;
		top: 15px;
		color: rgba(255, 255, 255, 0.7);
	}
	.border-bottom-1{
		border-color:rgba(255,255,255,0.5) !important;
		border-bottom-style: dashed !important;
	}
</style>
