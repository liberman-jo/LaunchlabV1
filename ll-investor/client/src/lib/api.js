const BASE = "/api";
function getToken() {
  try { return JSON.parse(localStorage.getItem("launchlab-store")||"{}").state?.token||null; } catch { return null; }
}
async function request(method, path, body) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},
    ...(body!==undefined?{body:JSON.stringify(body)}:{}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error||`Request failed: ${res.status}`);
  return data;
}
export const api = {
  auth: {
    register: b=>request("POST","/auth/register",b),
    login:    b=>request("POST","/auth/login",b),
    me:       ()=>request("GET","/auth/me"),
    update:   b=>request("PUT","/auth/me",b),
  },
  businesses: {
    list:    ()=>request("GET","/businesses"),
    get:     id=>request("GET",`/businesses/${id}`),
    create:  b=>request("POST","/businesses",b),
    update:  (id,b)=>request("PUT",`/businesses/${id}`,b),
    delete:  id=>request("DELETE",`/businesses/${id}`),
    outputs: id=>request("GET",`/businesses/${id}/outputs`),
  },
  tasks: {
    list:   bizId=>request("GET",`/tasks/business/${bizId}`),
    create: (bizId,b)=>request("POST",`/tasks/business/${bizId}`,b),
    update: (id,b)=>request("PUT",`/tasks/${id}`,b),
    delete: id=>request("DELETE",`/tasks/${id}`),
    run:    id=>request("POST",`/tasks/${id}/run`),
    bulk:   (bizId,tasks)=>request("POST",`/tasks/business/${bizId}/bulk`,{tasks}),
  },
  generate: {
    ideas:          intake=>request("POST","/generate/ideas",{intake}),
    tasks:          (idea,intake,id)=>request("POST","/generate/tasks",{idea,intake,businessId:id}),
    website:        id=>request("POST","/generate/website",{businessId:id}),
    businessPlan:   id=>request("POST","/generate/business-plan",{businessId:id}),
    socialContent:  id=>request("POST","/generate/social-content",{businessId:id}),
    emailTemplates: id=>request("POST","/generate/email-templates",{businessId:id}),
    chat:           (msg,bizId)=>request("POST","/generate/chat",{message:msg,businessId:bizId}),
  },
  integrations: {
    list:       bizId=>request("GET",`/integrations/${bizId}`),
    stripe:     bizId=>request("POST",`/integrations/${bizId}/stripe`),
    googleAuth: bizId=>request("GET",`/integrations/google/auth?businessId=${bizId}`),
    disconnect: (bizId,p)=>request("POST",`/integrations/${bizId}/${p}/disconnect`),
  },
  subscriptions: {
    plans:    ()=>request("GET","/subscriptions/plans"),
    me:       ()=>request("GET","/subscriptions/me"),
    checkout: b=>request("POST","/subscriptions/checkout",b),
    portal:   ()=>request("POST","/subscriptions/portal"),
  },
  deploy: {
    status: bizId=>request("GET",`/deploy/netlify/${bizId}`),
    deploy: bizId=>request("POST",`/deploy/netlify/${bizId}`),
    update: (bizId,instructions)=>request("POST",`/deploy/netlify/${bizId}/update`,{updateInstructions:instructions}),
  },
};
