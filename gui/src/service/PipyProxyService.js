import { request } from './common/request';
const isDev = process.env.NODE_ENV === "development";
export default class PipyProxyService {
	login(user, password) {
		return request('/api/login', "POST", {
			user, password
		});
	}
	clients() {
		return request('/users');
	}
	query({id, sql}) {
		return request('/api',"POST",sql);
	}
	os({id, sql}) {
		return request('/os',"POST",sql);
	}
	info({id}) {
		return request('/api/info');
	}
	getCa({id}) {
		return request('/api/get-ca');
	}
	getMeshes() {
		return request('/api/meshes');
	}
	joinMesh(name, config) {
		return request(`/api/meshes/${name}`,"POST",config);
	}
	createService({
		mesh,
		ep,
		name, 
		proto
	}) {
		return request(`/api/meshes/${mesh}/endpoints/${ep}/services/${proto}/${name}`,"POST", {});
	}
	deleteMesh(name) {
		return request(`/api/meshes/${name}`,"DELETE");
	}
	downloadCa({id}) {
		return '/api/download-ca';
	}
	renewCa({id, organization, commonName}) {
		return request('/api/renew-ca',"POST",{
			organization, commonName
		});
	}
	getConfig({id}) {
		return request('/api/get-config');
	}
	saveConfig({id, config}) {
		return request('/api/save-config',"POST",config);
	}
	getBackend() {
		return request('/get-backend-config');
	}
	saveBackend(config) {
		return request('/set-backend-config',"POST",config);
	}
	invoke({
		id,
		config
	}) {
		return request('/api/invoke',"POST",config);
	}
}
