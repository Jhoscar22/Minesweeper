import { mount } from "./ui/mount";

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("#app not found");
mount(app);
