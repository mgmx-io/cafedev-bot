// Bun fullstack routes: import page from "./x.html"
declare module "*.html" {
	const page: import("bun").HTMLBundle;
	export default page;
}
