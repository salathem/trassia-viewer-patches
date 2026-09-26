/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Application entry point. Everything, including the load-bearing
 * side-effect import order, lives in `bootstrap.tsx`; a host application
 * building the viewer from source calls `mountViewer` from its own entry
 * with options instead of editing this file.
 */

// turbo-cache-bust: the OOM'd 2fd153e7 build cached a partial apps/viewer/dist
// for this viewer:build input hash (built under fat-LTO memory pressure), so
// every later FULL-TURBO build restored the broken dist → READY-but-404. This
// content change forces a cache miss so the viewer rebuilds fresh now that
// thin-LTO removes the OOM. Safe to delete once a clean build is cached.

import { mountViewer } from './bootstrap';
// Trassia (Paket V-PFLEGE, Teil A): eine zentrale Schicht fuer Schriftleiter
// und Schrumpfverhalten. MUSS nach index.css stehen — dort wird Tailwind
// eingezogen, und unsere Regeln docken an Tailwind-Klassen an; bei gleicher
// Spezifitaet gewinnt das spaeter geladene Blatt. Begruendung je Regel steht
// in der Datei selbst (overlay/apps/viewer/src/ch-dichte.css).
import './ch-dichte.css';
// Trassia (U1-Nachzug): das Trassia-Favicon im Trassia-Modus — reiner
// Nebeneffekt-Import, tauscht die Icon-Links von index.html einmal beim Start
// (Begruendung in overlay/apps/viewer/src/lib/ch/favicon.ts).
import './lib/ch/favicon';

mountViewer(document.getElementById('root')!);
