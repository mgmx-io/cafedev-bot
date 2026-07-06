// Bun text imports: import styles from "./x.css" with { type: "text" }
declare module "*.css" {
	const css: string;
	export default css;
}
