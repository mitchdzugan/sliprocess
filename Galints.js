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
  REPUTATION: "rep"
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

const Row = ({ setFocusInd, nth, row, focusId, filter, doClip }) => {
  const [clipStart, setClipStart] = React.useState(row.clipStart || row.frameId);
  const [clipLength, setClipLength] = React.useState(row.clipLength || 400);
  if (row.id === focusId) {
    console.log(clipStart, clipLength, row);
  }
  return (
    <tr
      onClick={(e) => e.preventDefault() || setFocusInd(nth)} 
      id={`row_${row.id}`}
      key={row.id}
      className={row.id === focusId ? 'table-active' : null}
    >
      <td>{row.id}</td>
      <td>{row.game}</td>
      <td>{row.galint}</td>
      <td><input type="number" value={clipStart} onChange={(e) => setClipStart(e.target.value)} /></td>
      <td><input type="number" value={clipLength} onChange={(e) => setClipLength(e.target.value)} /></td>
      <td>{(parseInt(clipStart, 10) === row.clipStart && parseInt(clipLength, 10) === row.clipLength) ? "yes" : "no"}</td>
      <td><button onClick={() => doClip(parseInt(clipStart, 10), parseInt(clipLength, 10), row.game)} >clip</button></td>
      {filter === Filter.ALL ? (<td>{row.usage}</td>) : null}
    </tr>
  );
};

const Kills = ({ endpoint, miley }) => {
  const [_data, _setData] = React.useState([]);
  const getFilteredData = (_data, filter) => ({ 
    [Filter.ALL]: _data,
    [Filter.NEW]: _data.filter(d => !d.usage),
    [Filter.NO]: _data.filter(d => d.usage === Filter.NO),
    [Filter.IDK]: _data.filter(d => d.usage === Filter.IDK),
    [Filter.MAYBE]: _data.filter(d => d.usage === Filter.MAYBE),
    [Filter.YES]: _data.filter(d => d.usage === Filter.YES),
    [Filter.DEF]: _data.filter(d => d.usage === Filter.DEF),
  })[filter];
  const [filter, setFilter] = React.useState(initFilter);
  const data = getFilteredData(_data, filter);
  const combos = _.keyBy(data, "id");
  const [focusInd, setFocusInd] = React.useState(undefined);
  const focusId = ((data || [])[focusInd] || {}).id;
  const focused = combos[focusId];
  const isLoading = _data.length === 0;
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
    () => fetch("/api/galints").then(r => r.json()).then(setData),
    []
  );

  const source = isFocused && (focused.clipLength ? `/vods/clips/GALINT-${focused.id}.mp4?id=${Date.now()}` : `/vods/preview/${focused.game}.mp4`);
  console.log(focused)
  const start = isFocused && (
    focused.clipLength ? 0 : (focused.frameId / 60)
  );
  const end = isFocused && (
    focused.clipLength ? (focused.clipLength / 60) : ((400 + focused.frameId) / 60)
  );
  const loading = <div>loading...</div>
  const content = (isLoading || !focused || !focused.game) ? loading : (
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
        if (bossrush[keyCode]) {
          fetch('/api/galint_usage', {
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

  const doClip = (clipStart, clipLength, game) => {
    fetch('/api/do_clip', {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game, clipStart, clipLength, comboId: focused.id })
    }).then(res => res.json()).then(setData)
  };

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
              return ( 
                <a 
                  key={f}
                  onClick={(e) => { e.preventDefault(); setFilter(f); setFocusInd(0); }}
                  className={`btn btn-outline-secondary${f === filter ? ' active' : ''}`}
                >
                  {f} ({fdata.length})
                </a>
              );
            })}
          </div>
          <div style={{ width: "1rem" }} />
        </div>
        <div className={styles.tableWrapper}>
        <div className={styles.tableContainer}>
        <table key={filter} className="table table-dark" >
          <thead>
            <tr>
              <th>Id</th>
              <th>Game</th>
              <th>Galint</th>
              <th>Start</th>
              <th>Length</th>
              <th>Clipped?</th>
              <th>Clip</th>
              {filter === Filter.ALL ? (<th>Usage?</th>) : null}
            </tr>
          </thead>
          <tbody>
            {(data || []).map((row, nth) => (
              <Row
                key={row.id}
                setFocusInd={setFocusInd}
                nth={nth}
                row={row}
                focusId={focusId}
                filter={filter}
                doClip={doClip}
              />
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
