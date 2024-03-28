<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { removeAuthorization, AUTH_TYPE } from "@/service/common/request";
import { useLayout } from '@/layout/composables/layout';
import { useRouter } from 'vue-router';
import AppSmallMenu from './AppSmallMenu.vue';
import store from "@/store";
import XeyeSvg from "@/assets/img/white.png";
import HoverXeyeSvg from "@/assets/img/logo.png";
import PipySvg from "@/assets/img/pipy-white.png";
import { useConfirm } from "primevue/useconfirm";
import PipyProxyService from '@/service/PipyProxyService';
import { checkAuthorization } from "@/service/common/request";

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
          // router.push('/login');
        },
        reject: () => {
            
        }
    });
};
const logoHover = ref(false);
const clickCollapse = (path) => {
	router.push(path)
}
const playing = ref(false);
const play = () => {
	playing.value = !playing.value
}
const goLogin = () => {
	router.push('/login');
}

const pipyRun = ref(false);
const restartPipy = () => {
	restart.value = true;
	pipyRun.value = false;
	setTimeout(()=>{
		pipyRun.value = true;
		restart.value = false;
	},2000)
}

const restart = ref(false);
</script>

<template>
	<div class="e-card playing">
	  <div class="image"></div>
	  
	  <div class="wave"></div>
	  <div class="wave"></div>
	  <div class="wave"></div>
		
		<div class="pipyinfo" v-if="user">
			<div class="pipystatus">
				<img :src="PipySvg" height="25"/>
				<span class="status-point" :class="{'run': pipyRun}" />
			</div>
			<i class="pi pi-refresh" :class="{'spiner': restart}" @click="restartPipy"/>
		</div>
		<div class="userinfo" v-if="user">
			<Avatar icon="pi pi-user" style="background-color: rgba(255, 255, 2555, 0.5);color: #fff" shape="circle" />
			{{user?.id}}
		</div>
		<div class="infotop">
			<div>
				<img :class="{'spiner': playing}" class="logo pointer " @mouseleave="logoHover = false" @mouseover="logoHover = true" :src="logoHover?HoverXeyeSvg:XeyeSvg" height="60"/>
			</div>
			<div>
				
			</div>
			<div class="mt-4">
				<Button v-if="!isLogined" class="transparent-button w-20rem" @click="goLogin">Login</Button>
				<Dropdown 
				v-else
				v-model="selectedGateway" 
				:options="gateways" 
				optionLabel="label" 
				placeholder="Select a Hub" 
				class="w-20rem transparent-selector">
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
			<div v-if="isLogined" class="flex-item">
				<Button  v-tooltip="'Logout'" class="pointer" severity="help" text rounded aria-label="Filter" @click="logout" >
					<i class="pi pi-power-off " />
				</Button>
			</div>
			
			<div class="flex-item">
				<Button v-tooltip="'Config'" class="pointer" severity="help" rounded text aria-label="Filter" @click="clickCollapse('/client/config')" >
					<i class="pi pi-cog "  />
				</Button>
			</div>
			<div class="flex-item">
				<Button :disabled="!isLogined" v-tooltip="'Find Hub'" class="pointer" severity="help" text rounded aria-label="Filter" @click="clickCollapse('/agent/hub/list')" >
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
	.logo:hover{
		opacity: 1;
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
	.transparent-selector{
		border-width: 4px;
		background-color: rgba(255, 255, 255, 0.2);
		color: #fff;
		border-color:rgba(255,255,255,0.5);
	}
	:deep(.transparent-selector .p-dropdown-label){
		color: rgba(255,255,255,0.9);
		font-weight: bold;
	}
	:deep(.transparent-selector .p-dropdown-label.p-placeholder){
		color: rgba(255,255,255,0.5) !important;
		font-weight: bold;
	}
	.transparent-button{
		border-color:rgba(255,255,255,0.5);
		color: rgba(255,255,255,0.7);
		font-weight: bold;
		text-align: center;
		display: inline-block;
		background-color: rgba(255, 255, 255, 0.2);
		border-width: 4px;
	}
	.transparent-button:hover{
		
		background-color: rgba(255, 255, 255, 0.5);
		border-color:rgba(255,255,255,0);
		color: rgba(255,255,255,1);
	}
	.pipyinfo{
		position: absolute;
		display: flex;
		left: 15px;
		top: 12px;
	}
	.pipystatus{
		height: 12px;
		border-right: 1px dashed rgba(255, 255, 255, 0.5);
		padding-right: 20px;
		position: relative;
		top: 5px;
	}
	.pipystatus>img{
		vertical-align: middle;
		margin-right: 10px;
		position: relative;
		top: -8px;
		opacity: 0.9;
	}
	.pipyinfo .pi-refresh{
		color: #fff;
		vertical-align: middle;
		opacity: 0.7;
		cursor: pointer;
		font-size: 18px;
		margin-left: 15px;
		height: 20px;
		transition: all .3s;
	}
	.pipyinfo .pi-refresh:hover{
		opacity: 1;
	}
	.status-point{
		opacity: 0.8;
		display: inline-block;
		vertical-align: middle;
		position: relative;
		top: -7px;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background-color: #EA4739;
		box-shadow: 0 0 2px 2px #EA4739;
	}
	.status-point.run{
		opacity: 0.8;
		background-color: #00AB5B;
		-webkit-animation: bling 2s infinite linear;
		animation: bling 2s infinite linear
	}
	@keyframes bling{
		0% {
			box-shadow: 0 0 2px 2px #00AB5B;
		}
		100% {
			box-shadow: 0 0 4px 4px #00AB5B;
		}
	}
</style>
