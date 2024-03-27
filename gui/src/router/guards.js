import { hasAuthority } from "@/service/common/authority-utils";
import { loginIgnore } from "@/router/index";
import { checkAuthorization, spread, merge } from "@/service/common/request";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { useToast } from "primevue/usetoast";
import { ipcRenderer } from 'electron'

NProgress.configure({ showSpinner: true });



/**
 * Progress Start
 * @param to
 * @param form
 * @param next
 */
const progressStart = (to, from, next) => {
  // start progress bar
  if (!NProgress.isStarted()) {
    NProgress.start();
  }
  next();
};

/**
 * Login Guard
 * @param to
 * @param form
 * @param next
 * @param options
 */
const loginGuard = (to, from, next, options) => {
	const $store = options.store;
  const { toast } = options;
  if (!loginIgnore.includes(to) && !checkAuthorization()) {
		const toast = useToast();
		toast.add({ severity: 'warn', summary: 'Tips', detail: 'Login is invalid, please login again', life: 3000 });
		$store.commit('account/setRedirect', to.path);
		ipcRenderer.send('resize',{
			width: 408,
			height: 455
		})
    next({ path: "/login" });
  } else {
		if(to.path == "/login"){
			ipcRenderer.send('resize',{
				width: 408,
				height: 455
			})
		} else {
			ipcRenderer.send('resize',{
				width: 1280,
				height: 800
			})
		}
    next();
  }
};

/**
 * Progress Done
 * @param to
 * @param form
 * @param options
 */
const progressDone = () => {
  // finish progress bar
  NProgress.done();
};

export default {
  beforeEach: [
    progressStart,
    loginGuard,
  ],
  afterEach: [progressDone],
};
