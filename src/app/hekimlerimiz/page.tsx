// src/app/hekimlerimiz/page.tsx
import { getDoctorsList } from '@/app/actions/doctors';
import DoctorCard from '@/components/DoctorCard';
import './hekimler.css';

export default async function DoctorsPage() {
  const res = await getDoctorsList();
  const doctors = res.success ? (res.doctors || []) : [];

  return (
    <div className="doctors-page-container">
      <div className="container">
        <header className="page-header fade-in">
          <h1>Hekimlerimiz</h1>
          <p>Alanında uzman, deneyimli ve gülümsemeye değer veren ekibimizle tanışın.</p>
        </header>

        <div className="doctors-grid">
          {doctors.length === 0 ? (
            <div className="loading-container">Şu an kayıtlı hekim bulunmamaktadır.</div>
          ) : (
            doctors.map(doctor => (
              <DoctorCard key={doctor.id} doctor={doctor as any} />
            ))
          )}
        </div>

        <section className="join-team glass fade-in">
          <h3>Bize Katılın</h3>
          <p>Vizyoner ekibimizin bir parçası olmak ister misiniz?</p>
          <button className="btn-outline">Kariyer Fırsatları</button>
        </section>
      </div>
    </div>
  );
}
