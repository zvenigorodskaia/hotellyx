type ReservationPageProps = {
  params: {
    token: string;
  };
};

export default function ReservationTokenPage({ params }: ReservationPageProps) {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Reservation Link</h1>
      <p className="mt-2 text-sm text-slate-600">Placeholder for /r/{params.token}</p>
    </section>
  );
}
