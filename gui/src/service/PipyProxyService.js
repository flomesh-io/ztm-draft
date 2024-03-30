import { request, METHOD } from "@/service/common/request";
import { isServer } from "@/service/common/authority-utils";
const isDev = process.env.NODE_ENV === "development";
export default class PipyProxyService {
	login(user, password) {
		const loginPath = isDev ? (isServer() ? '/server/api/login' : '/client/api/login'):'/api/login';
		return request(loginPath, METHOD.POST, {
			user, password
		});
	}
	beforePath(id){
		return isDev?(id?`/server/${id}`:'/client'):(id?`/${id}`:'');
	}
	clients() {
		return request(isDev?'/server/users':'/users', METHOD.GET);
	}
	query({id, sql}) {
		return request(this.beforePath(id)+'/api', METHOD.POST, sql);
	}
	os({id, sql}) {
		return request(this.beforePath(id)+'/os', METHOD.POST, sql);
	}
	info({id}) {
		return request(this.beforePath(id)+'/api/info', METHOD.GET);
	}
	getCa({id}) {
		return request(this.beforePath(id)+'/api/get-ca', METHOD.GET);
	}
	getMyGateways() {
		//http://localhost:1420/api/meshes
		return request('/client/api/meshes', METHOD.GET);
	}
	downloadCa({id}) {
		return this.beforePath(id)+'/api/download-ca';
	}
	renewCa({id, organization, commonName}) {
		return request(this.beforePath(id)+'/api/renew-ca', METHOD.POST, {
			organization, commonName
		});
	}
	getConfig({id}) {
		return request(this.beforePath(id)+'/api/get-config', METHOD.GET);
	}
	saveConfig({id, config}) {
		return request(this.beforePath(id)+'/api/save-config', METHOD.POST, config);
	}
	getBackend() {
		return request(isDev?'/server/get-backend-config':'/get-backend-config', METHOD.GET);
	}
	saveBackend(config) {
		return request(isDev?'/server/set-backend-config':'/set-backend-config', METHOD.POST, config);
	}
	invoke({
		id,
		config
	}) {
		return request(this.beforePath(id)+'/api/invoke', METHOD.POST, config);
	}
}
