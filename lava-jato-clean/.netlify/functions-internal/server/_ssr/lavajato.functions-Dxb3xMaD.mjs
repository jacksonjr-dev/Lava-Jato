import { __toESM } from "../_runtime.mjs";
import { require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { isRedirect, useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { TSS_SERVER_FUNCTION, createServerFn, getServerFnById } from "./server-BpsVjaE1.mjs";
import { requireSupabaseAuth } from "./auth-middleware-CkvhgX1Y.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/lavajato.functions-Dxb3xMaD.js
var import_react = /* @__PURE__ */ __toESM(require_react());
function useServerFn(serverFn) {
	const router = useRouter();
	return import_react.useCallback(async (...args) => {
		try {
			const res = await serverFn(...args);
			if (isRedirect(res)) throw res;
			return res;
		} catch (err) {
			if (isRedirect(err)) {
				err.options._fromLocation = router.stores.location.get();
				return router.navigate(router.resolveRedirect(err).options);
			}
			throw err;
		}
	}, [router, serverFn]);
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
/** O portal só atende lava-jatos cujo plano inclui a área do cliente. */
var searchPublicTenants = createServerFn({ method: "GET" }).validator((data) => data).handler(createSsrRpc("12e09bc04e62efbeaba16593cb5411b0df194df8778615c26456e8017698c766"));
var clientPortalLogin = createServerFn({ method: "POST" }).validator((data) => data).handler(createSsrRpc("012a2f41566f7c8e2a5ccb7a35261938fb42b7afbe3527032385bb11da2e0bbb"));
var getSession = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("a86bf85bb2776fd132d5437b1c81b4336e7b4991925f565e8cab708b65c5329d"));
var updateTenantProfile = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(createSsrRpc("6100bd8c4729c73c1daa91b0efe03cc77b864b89eaacd2ad3208fd9235afeeca"));
var getDemoOwnerLoginHint = createServerFn({ method: "GET" }).handler(createSsrRpc("c71ad2c9b038ce32207de8175e668d6032786fb2718a701b631e9734bfeccd46"));
var verifyOwnerBusiness = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(createSsrRpc("54dbe4f3d1029313295d65b446b3d1e213373edd72e6ae5bbeebca474bf6adc3"));
var createTenant = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(createSsrRpc("77e016e64b53e1c0475e8be850fa459f0fa0e08dd440a136176187bbc381e417"));
var listServices = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("fe7ec4d3613fec8ddf9e5e92b5230239c269b721d52062fb77b6e3669d43235e"));
var createService = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(createSsrRpc("ad1c7eb6b7a0bbd4d9674ec55ec26f88ce1ebb7595c5fa0f45590d91a3ab93e4"));
var updateService = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(createSsrRpc("aebf39534c344906f5daec8e89c0d851e8ea7b03ecdb9a9ffa4c4c9e9796c434"));
var deactivateService = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(createSsrRpc("722c8b36b0477ef2eae278b015f68f9c6bb464f234e82fd37281d37b4f731dc5"));
createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(createSsrRpc("77f05fdaa7a03b39a2147333601e9ceb2097d89a77b929a4bc6a0f23d7a45459"));
var findVehicleByPlate = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(createSsrRpc("13adc082f700b296234983e1ff4ea19ec4d2df475450e3b9374c9e8fb29434d1"));
var plateHistory = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(createSsrRpc("2a46c79a30dd12c8c9a7f94964de23b285b419fb4abd36fd2f3418e4f01adc47"));
var listVehicles = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("8ede43f00b5994e1ef8907a16e98580674e7763d09cfaf55c53c29a378861833"));
createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(createSsrRpc("f7c6bcab37c4ea76c6626ec6026b1275a63eb31d11c10e4f59601d7be293ae22"));
createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(createSsrRpc("9a048251188dda049b95c676ea12c29ad4837e5714a73efe2273f35409045d9e"));
createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(createSsrRpc("b3f5f0a6e30e9a3219e9dc9e4a51312a5271bea1b2e8c807da16c863e79f91cb"));
var createOrder = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(createSsrRpc("fe1eb8f88d4afd2b18a892673c563031d8de7036b06080eb227e849b23ec9e06"));
var createNewCustomerOrder = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(createSsrRpc("bfb9f9dcdf8847228c53b61ea0eafcf315e9cfd060878669916a07cb94dd1409"));
var getOrder = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(createSsrRpc("84c80ec41077e95228a77d0055d0ab509c3884588b920d82e831ca8d45b07f17"));
var updateOrderStatus = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(createSsrRpc("a2d38cf6203cff30b9968419155917eede68ca9517b153ca063e4a47210bce3c"));
var registerPayment = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(createSsrRpc("da13fcd18830983470119b81ef07bca54f157607047e18a9adc7863cc36bb08e"));
var homeSummary = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("b3dcdc04aee1c1e1e9091394e3104a64e3485e2c61e4790e78d6f84f0e8c2b4c"));
var financialSummary = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("0a59b034cee327026b8d544de7fbd33f56191bdd62a65132abd95c10f3630c0b"));
var getPixSettings = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("df621c5b0f43da658c627439717697dd8a79e326edc647677edc462724d018d7"));
var updatePixSettings = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(createSsrRpc("7515b9ad53fa3915198ff658728aad817b83dd0ea4ec26c345a586063feea9c5"));
createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("b21bc537b922faac3a211c047e0e6c62831739a74d44df378e9472c0abc654b3"));
var listActiveOrders = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("e2f29458b6adf3aa9f581bde8c583d7970320faa6ae393e669b04dbf74ffec6f"));
var adminListTenants = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("476fcff616171cb2127c8ed6e620c1c99b3b944fcb59a2141b50ac171dabcb33"));
var adminUpdateSubscription = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(createSsrRpc("cf391fcfacfc3e208434adece91eb513668678f0371f7901579e84e991453d37"));
/** Pagamentos de um intervalo, com OS, placa, cliente e serviços (financeiro). */
var listPayments = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(createSsrRpc("78503e5ceda77076c7ee689b158411447fce94b4296be352bc09a58cbc0b91c3"));
/**
* Envia (data URL) ou remove (null) o logo do lava-jato. A imagem é validada
* no servidor e salva na pasta pública "logos", em uma subpasta da empresa.
*/
var setTenantLogo = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(createSsrRpc("6957b5a111c4240a5b246e068d045abb6c5faf549c1d203cbfee30902485bf7e"));
//#endregion
export { adminListTenants, adminUpdateSubscription, clientPortalLogin, createNewCustomerOrder, createOrder, createService, createTenant, deactivateService, financialSummary, findVehicleByPlate, getDemoOwnerLoginHint, getOrder, getPixSettings, getSession, homeSummary, listActiveOrders, listPayments, listServices, listVehicles, plateHistory, registerPayment, searchPublicTenants, setTenantLogo, updateOrderStatus, updatePixSettings, updateService, updateTenantProfile, useServerFn, verifyOwnerBusiness };
