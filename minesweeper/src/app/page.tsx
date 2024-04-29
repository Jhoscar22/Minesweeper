import styles from "./page.module.css";
import Grid from "@/components/grid/grid";


export default function Home() {
  return (
    <main className={styles.main}>
      <h1>Minesweeper</h1>
      <Grid />
    </main>
  );
}