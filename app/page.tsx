import { Wizard } from '@/components/Wizard';
import { Header } from '@/components/Header';

export default function Home() {
  return (
    <>
      <Header />
      <div className="pt-16">
        <Wizard />
      </div>
    </>
  );
}
