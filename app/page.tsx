import { Wizard } from '@/components/Wizard';
import { Header } from '@/components/Header';

export default function Home() {
  return (
    <>
      <Header 
        userName="John Doe"
        userEmail="john.doe@example.com"
      />
      <div className="pt-16">
        <Wizard />
      </div>
    </>
  );
}
