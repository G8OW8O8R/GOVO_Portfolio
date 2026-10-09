"use client";

/**
 * The client components of every window, bundled with the desktop (~13 KB
 * gzip). Opening a window then needs only its server-rendered content,
 * which loads on hover, focus or touch of its link. Otherwise each window
 * route has a chunk of its own that the browser can request only once that
 * content has arrived: one more round trip, after the click.
 * A client component a window uses that is missing here still works; that
 * window just waits for its own chunk again.
 */
import "./AppWindow";
import "./Tabs";
import "./motion/PlayOnOpen";
import "./motion/RevealHeading";
import "./motion/Tilt";
import "./motion/Odometer";
import "./motion/PreviewVideo";
import "./motion/PricingTitle";
import "./motion/ShowreelVideo";
import "./motion/Steps";
import "./live/LiveThumb";
import "./live/LiveTicker";
import "./content/ContactForm";
import "@/components/cv/PrintButton";
import "@/components/desktop/LoadAhead";
