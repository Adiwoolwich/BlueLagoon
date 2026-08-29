import { useEffect, useMemo, useRef, useState } from "react";
import { MapHost } from "./components/map-host";
import {
  LocateButton,
  SearchAndFilters,
  SearchBar,
  StationPanel,
} from "./components/station-panel";
import { SiteFooter } from "./components/site-footer";
import { DatenschutzPage, ImpressumPage } from "./components/legal-pages";
import { FeedbackPage } from "./components/feedback-form";
import { hasPreciseCoords, STATIONS } from "./lib/stations";
import { allStations, applyFilters, useAppStore } from "./lib/store";
import { inBounds } from "./lib/geo";
import { hasMapDeepLink, parseUrl } from "./lib/url-state";
import { t, useLang } from "./lib/i18n";
import { cn } from "./lib/utils";

const SKIP_KEY = "bl-skip-landing";
