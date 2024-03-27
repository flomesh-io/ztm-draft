<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
    list: {
        type: Array,
        default: ()=>{
					return [];
				}
    },
});

const tags = ref(props.list);
watch(()=>{
	return props.list
},()=>{
	tags.value = props.list;
},{
	deep:true
});
const newTag = ref("");
const addTag = () => {
	if(!!newTag.value){
		tags.value.push(newTag.value);
		newTag.value = "";
		emits("update:list",tags.value);
		emits("change",tags.value);
	}
}

const emits = defineEmits(['change','update:list']);
const removeTag = (index) => {
	tags.value.splice(index,1);
	emits("update:list",tags.value);
	emits("change",tags.value);
	// localStorage.setItem('tags', tags.value.join(","));
}
</script>

<template>
    <Chip class="mr-2" v-for="(tag,tagidx) in list" :label="tag" removable @remove="removeTag(tagidx)"/>
    <Chip class="pl-0 pr-3">
        <span class="bg-primary border-circle w-2rem h-2rem flex align-items-center justify-content-center">
    			<i class="pi pi-pencil"/>
    		</span>
        <span class="ml-2 font-medium">
    			<InputText @keyup.enter="addTag" placeholder="Add" class="add-tag-input" :unstyled="true" v-model="newTag" type="text" />
    		</span>
    </Chip>
</template>

<style scoped lang="scss">
</style>