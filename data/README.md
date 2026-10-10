# Bundled transit data

These files are schedule snapshots, separate from the MIT source license. They were downloaded on 2026-10-11 in Taiwan time. I use sample dates with actual service in each file rather than presenting them as current live service.

| File | Agency and source | Data terms | Default date |
| :--- | :--- | :--- | :--- |
| `public/data/bart.zip` | [Bay Area Rapid Transit](https://www.bart.gov/dev/schedules/google_transit.zip) | [BART developer agreement](https://www.bart.gov/schedules/developers/developer-license-agreement) | 2026-08-24 |
| `public/data/maywood.zip` | [Maywood Express Shuttle](https://gtfs.dds.dot.ca.gov/gtfs_files/MaywoodGTFS.zip) | [Cal ITP portal](https://gtfs.dds.dot.ca.gov/), CC BY 4.0 | 2026-10-12 |
| `public/data/yurok.zip` | [Yurok Tribe Transportation Department](https://gtfs.dds.dot.ca.gov/gtfs_files/YurokRiverOtterFerryGTFS.zip) | [Cal ITP portal](https://gtfs.dds.dot.ca.gov/), CC BY 4.0 | 2026-10-12 |

The two Cal ITP files are redistributed unchanged. Attribution is retained in the application and in this table. [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) permits reuse with attribution. BART's data terms are separate. No agency logos, trademarks or official system map images are bundled.

BART `feed_info.txt` ends on 2026-08-30, though calendar entries continue through January 2027. The browser loads the frozen local copy and shows its validity fields. Use a newly downloaded operator feed for a newer schedule.
