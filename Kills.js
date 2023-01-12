import Head from 'next/head'
import Image from 'next/image'
import styles from './styles/Home.module.css'
import React from 'react';
import _ from "lodash";
import VideoLooper from 'react-video-looper'

const Filter = {
  ALL: "all",
  NEW: "new",
  NO: "no",
  IDK: "idk",
  MAYBE: "maybe",
  YES: "yes",
  DEF: "def",
}

const Char = {
  0: "Falcon",
  1: "DK",
  2: "Fox",
  3: "G&W",
  4: "Kirby",
  5: "Bowser",
  6: "Link",
  7: "Luigi",
  8: "Mario",
  9: "Marth",
  10: "Mewtwo",
  11: "Ness",
  12: "Peach",
  13: "Pika",
  14: "ICs",
  15: "Puff",
  16: "Samus",
  17: "Yoshi",
  18: "Zelda",
  19: "Sheik",
  20: "Falco",
  21: "Young Link",
  22: "Dr. Mario",
  23: "Roy",
  24: "Pichu",
  25: "Ganondorf"
};

const Stage = {
  2: "FoD",
  3: "Stadium",
  8: "Yoshis",
  28: "Dreamland",
  31: "Battlefield",
  32: "FD",
}

const isServer = (typeof window === 'undefined');
const hash = isServer ? Filter.YES : ((window && window.location && window.location.hash.slice(1)) || Filter.YES);
const parts = hash.split('.');
const initFilter = parts[0];
const initId = parseInt(parts[1]);
const Kills = ({ endpoint, miley }) => {
  const [_data, _setData] = React.useState({
    combos: [],
    all: 0,
    processed: 0,
    recorded: 0,
  });
  const { all, processed, recorded } = _data;
  const getFilteredData = (_data, filter) => ({ 
    [Filter.ALL]: _data.combos,
    [Filter.NEW]: _data.combos.filter(d => !d.bossrush),
    [Filter.NO]: _data.combos.filter(d => d.bossrush === Filter.NO),
    [Filter.IDK]: _data.combos.filter(d => d.bossrush === Filter.IDK),
    [Filter.MAYBE]: _data.combos.filter(d => d.bossrush === Filter.MAYBE),
    [Filter.YES]: _data.combos.filter(d => d.bossrush === Filter.YES),
    [Filter.DEF]: _data.combos.filter(d => d.bossrush === Filter.DEF),
  })[filter];
  const [filter, setFilter] = React.useState(initFilter);
  const data = getFilteredData(_data, filter);
  const combos = _.keyBy(data, "id");
  const [focusInd, setFocusInd] = React.useState(undefined);
  const focusId = ((data || [])[focusInd] || {}).id;
  const focused = combos[focusId];
  const isLoading = _data.combos.length === 0;
  const isFocused = Boolean(focused);
  const videoRef = React.useRef(null);
  const R = React.useRef({});
  const setData = (data) => {
    let isSet = isFocused;
    getFilteredData(data, filter).forEach(({ id }, ind) => {
      if (!isSet && id === initId) {
        setFocusInd(ind);
        isSet = true; 
      }
    });
    if (!isSet) { setFocusInd(0); }
    _setData(data);
  };
  React.useEffect(
    () => fetch("/api/page").then(r => r.json()).then(setData),
    []
  );

  const source = isFocused && `/vods/preview/${focused.filename}.mp4`;
  const start = isFocused && (
    focused.startFrame / 60
  );
  const end = isFocused && (
    (focused.frames + 240 + focused.startFrame) / 60
  );
  const loading = <div>loading...</div>
  const content = (isLoading || !focused || !focused.filename) ? loading : (
    <video
      key={source}
      ref={videoRef} 
      controls={true} 
      webkit-playsinline="true"
      playsinline="true"
      autoplay=""  
    >
      <source src={source} type="video/mp4" />
    </video>
  );
  R.current.start = start;
  R.current.end = end;
  R.current.data = data || [];
  R.current.focusInd = focusInd;

  React.useEffect(
    () => {
      if (isFocused) {
        window.location.hash = `${filter}.${focused.id}`;
      }
    },
    [isFocused && focused.id, filter]
  );

  React.useEffect(
    () => {
      const I = setInterval(
        () => { 
          const { start, end } = R.current;
          const video = videoRef.current || null;
          if (!video) { return; } 
          const currentTime = video.currentTime;
          if (currentTime < start || currentTime > end) {
            video.currentTime = start;
          }
          if (!video.playing) { video.play(); }
        },
        100
      );
      return () => {
        clearInterval(I);
      };
    },
    []
  );

  React.useEffect(
    () => {
      const fn = (e) => {
        const { focusInd, data } = R.current;
        const keyCode = e.keyCode;
        const focused = data[focusInd] || {};
        if (keyCode === 40) {
          setFocusInd(Math.max(0, Math.min(data.length - 1, focusInd + 1)));
          return;
        }
        if (keyCode === 38) {
          setFocusInd(Math.max(0, focusInd - 1));
          return;
        }
        const bossrush = {
          68: Filter.DEF,
          89: Filter.YES,
          78: Filter.NO,
          77: Filter.MAYBE,
          75: Filter.IDK,
          67: "null",
        };
        if (bossrush[keyCode] && endpoint) {
          fetch(`/api/${endpoint}`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bossrush: bossrush[keyCode], comboId: focused.id })
          }).then(res => res.json()).then(setData)
        }
      };
      window.addEventListener("keydown", fn);
      return () => window.removeEventListener("keydown", fn);
    },
    []
  );

  const dec2 = (n) => Math.floor(n * 100) / 100;
  const [isLoaded, setIsLoaded] = React.useState(false);
  React.useEffect(() => {
    if (!isServer) {
      setTimeout(() => setIsLoaded(true), 0)
    }
  }, []);
  if (!isLoaded) { return <div/>; }
  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3" crossorigin="anonymous" />
      </Head>

      <main key={filter} className={styles.main}>
        <div className={styles.videoWrapper}>
          <div className={styles.videoContainer}>
            {content}
          </div>
        </div>
        <div style={{ 
          display: "flex", 
          flexDirection: "row",
          justifyContent: "center",
          flex: "0 0 2rem", 
          background: "#111",
          alignItems: "center"
        }} >
          <div className="btn-group">
            {[Filter.NEW, Filter.YES, Filter.DEF, Filter.NO, Filter.MAYBE, Filter.IDK/*, Filter.ALL*/].map(f => {
              const fdata = getFilteredData(_data, f);
              const frames = fdata.reduce((total, row) => total + row.frames, 0);
              const secondsRaw = frames / 60;
              const minutesRaw = secondsRaw / 60;
              const minutes = Math.floor(minutesRaw);
              const seconds = Math.floor(60 * (minutesRaw - minutes));
              return ( 
                <a 
                  key={f}
                  onClick={(e) => { e.preventDefault(); setFilter(f); setFocusInd(0); }}
                  className={`btn btn-outline-secondary${f === filter ? ' active' : ''}`}
                >
                  {f} ({fdata.length}) {minutes}:{seconds < 10 ? '0' : ''}{seconds}
                </a>
              );
            })}
          </div>
          <div style={{ width: "1rem" }} />
          <span style={{ color: "white", width: "13rem", fontSize: "0.75rem" }} >
            {all} files  ⁃  {Math.floor(1000 * processed / all) / 10}% ({processed}) processed
          </span>

        </div>
        <div className={styles.tableWrapper}>
        <div className={styles.tableContainer}>
        <table key={filter} className="table table-dark" >
          <thead>
            <tr>
              <th>Length</th>
              <th>Date</th>
              <th>Time</th>
              <th>Moves</th>
              <th>Damage</th>
              <th>Character</th>
              <th>Stage</th>
              <th>Score</th>
              {filter === Filter.ALL ? (<th>Bossrush?</th>) : null}
            </tr>
          </thead>
          <tbody>
            {(data || []).map((row, nth) => (
              <tr
                onClick={(e) => e.preventDefault() || setFocusInd(nth)} 
                id={`row_${row.id}`}
                key={row.id}
                className={row.id === focusId ? 'table-active' : null}
              >
                <td>{dec2(row.frames / 60)}</td>
                <td>{(new Date(row.date)).toLocaleDateString()}</td> 
                <td>{(new Date(row.date)).toLocaleTimeString()}</td> 
                <td>{row.moves}</td>
                <td>{dec2(row.damage)}</td>
                <td>{Char[row.characterId]} [{row.characterId}]</td>
                <td>{Stage[row.stageId] || "OTHER"} [{row.stageId}]</td> 
                <td>{row.score || 0}</td> 
                {filter === Filter.ALL ? (<td>{row.bossrush}</td>) : null}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        </div>
      </main>
    </div>
  )
}

export default Kills;
