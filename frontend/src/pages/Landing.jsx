import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import HeroMap from "../components/HeroMap";
import { getSession } from "../auth";

export default function Landing() {
  const session = getSession();

  return (
    <div className="page" id="home">
      <Navbar variant="landing" />

      <div className="hero container">
        <div>
          <h1>Know What's Ahead Before It's Too Late.</h1>
          <p>
            Rakshak watches highway wildlife-detection cameras in real time and warns
            you the moment something is on the road ahead of your route — with enough
            time to actually slow down.
          </p>
          <div style={{ marginTop: 32 }}>
            <Link className="btn btn-primary" to={session ? "/dashboard" : "/signup"}>
              Get Started
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <HeroMap />
        </div>
      </div>

      <section className="section" id="how-it-works">
        <h2 className="section-title">How it Works</h2>
        <div className="card-grid">
          <div className="card">
            <h3>Live Detections</h3>
            <p>Roadside cameras report wildlife sightings the instant they happen, broadcast straight to your map.</p>
          </div>
          <div className="card">
            <h3>Route Matching</h3>
            <p>Alerts are matched against your planned route, not just raw distance — so you're only warned about what's actually ahead.</p>
          </div>
          <div className="card">
            <h3>ETA Alerts</h3>
            <p>Rakshak estimates how many minutes until you reach the danger zone, using your live speed and position.</p>
          </div>
        </div>
      </section>

      <section className="section" id="about">
        <h2 className="section-title">About Rakshak</h2>
        <p style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          Rakshak ("protector") is a road-safety project connecting wildlife-detection
          devices along highways to drivers in real time, aiming to cut down
          collisions with animals like nilgai that wander onto the road at night.
        </p>
      </section>

      <footer className="site-footer">© {new Date().getFullYear()} Rakshak</footer>
    </div>
  );
}
