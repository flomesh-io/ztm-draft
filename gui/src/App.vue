<script setup>
	import {ipcRenderer} from 'electron'
	const emit = () =>{
	  ipcRenderer.send('message',123)
	}
	ipcRenderer.on('load',(_,message) => {
	  console.log(message,123);
		// BrowserWindow.getCurrentWindow().setSize(500, 500)
	})
	//<button @click="emit">发送消息</button>
</script>

<template>
	<Toast />
	<router-view />
</template>

<style scoped></style>
