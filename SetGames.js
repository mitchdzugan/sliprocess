import Head from 'next/head'
import styles from './styles/Home.module.css'
import React from 'react';
import _ from "lodash";

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
  3: "PS",
  8: "YI",
  28: "DL",
  31: "BF",
  32: "FD",
}

const isServer = (typeof window === 'undefined');
const hash = isServer ? Filter.YES : ((window && window.location && window.location.hash.slice(1)) || Filter.YES);
const parts = hash.split('.');
const initFilter = parts[0];
const initId = parseInt(parts[1]);
const Kills = ({ endpoint, miley }) => {
  const [_data, _setData] = React.useState([]);
  const { all, processed, recorded } = _data;
  const getFilteredData = (_data, filter) => ({ 
    [Filter.ALL]: _data.filter(d => d.setId !== 0 && (!d.setId || d.setId > 1600)),
    [Filter.NO]: _data.filter(d => d.setId === 0),
    [Filter.YES]: _data.filter(d => d.setId && d.setId > 0),
  })[filter];
  const [filter, setFilter] = React.useState(initFilter);
  const data = getFilteredData(_data, filter);
  const games = _.keyBy(data, "id");
  const [focusInd, setFocusInd] = React.useState(undefined);
  const focusId = ((data || [])[focusInd] || {}).id;
  const focused = games[focusId];
  console.log({ focusId, focused, focusInd });
  const isLoading = _data.length === 0;
  const isFocused = Boolean(focused);
  const videoRef = React.useRef(null);
  const R = React.useRef({});
  const setData = (data) => {
    let isSet = isFocused;
    console.log({ isSet, isFocused, initId, pre: true });
    getFilteredData(data, filter).forEach(({ id, setId }, ind) => {
      if (!isSet && !setId && setId !== 0) {
        setFocusInd(ind);
        isSet = true; 
      }
    });
    console.log({ isSet, isFocused, initId, pre: false });
    if (!isSet) { setFocusInd(0); }
    _setData(data);
  };
  React.useEffect(
    () => fetch("/api/setgames").then(r => r.json()).then(setData),
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
          console.log(data.length, focusInd + 1)
          setFocusInd(Math.max(0, Math.min(data.length - 1, focusInd + 1)));
          return;
        }
        if (keyCode === 38) {
          setFocusInd(Math.max(0, focusInd - 1));
          return;
        }
        const results = {
          87: Filter.YES,
          76: Filter.NO,
          81: 'fix',
          78: "null",
        };
        if (results[keyCode]) {
          fetch(`/api/setreport`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ result: results[keyCode], filename: focused.filename })
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
  console.log({ data })
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
            {[Filter.ALL, Filter.YES, Filter.NO].map(f => {
              const fdata = getFilteredData(_data, f);
              const frames = fdata.reduce((total, row) => total + row.lastFrame, 0);
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
              <th>CC</th>
              <th>Name</th>
              <th>Character</th>
              <th>Stage</th>
              <th>is?</th>
              <th>Result</th>
              <th>setId</th>
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
                <td>{Math.floor(row.lastFrame / 60 / 60)}:{Math.floor((row.lastFrame / 60) % 60)}</td>
                <td>{(new Date(row.date)).toLocaleDateString()}</td> 
                <td>{(new Date(row.date)).toLocaleTimeString()}</td> 
                <td>{row.oppCC}</td> 
                <td>{row.oppDisplayName}</td> 
                <td>{Char[row.characterId]} [{row.characterId}]</td>
                <td>{Stage[row.stageId] || "OTHER"} [{row.stageId}]</td> 
                <td>{row.isSlpRanked ? 'Y' : (row.isSlpRanked === false ? 'N' : '-')}</td> 
                <td>{({ [true]: 'W', [false]: 'L' })[row.isWin]}</td> 
                <td>{row.setId}</td> 
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
