import Head from 'next/head'
import Image from 'next/image'
import styles from './styles/Home.module.css'
import React from 'react';
import _ from "lodash";
import VideoLooper from 'react-video-looper'
import Modal from 'react-modal';
Modal.setAppElement('#__next');

const shuffle = (a) => {
  var seed = 1;
  function random() {
      var x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
  }
  const doShuffle = (_array) => {
    const array = [..._array];
    let currentIndex = array.length;
    while (currentIndex != 0) {
      const randomIndex = Math.floor(random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [ array[randomIndex], array[currentIndex]];
    }
    return array;
  }
  return doShuffle(a);
}

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

const customModalStyles = {
  overlay: {
    zIndex: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.75)'
  },
  content: {
    background: "#111",
    border: '1px solid #666',
  }
};

const isServer = (typeof window === 'undefined');
const hash = isServer ? Filter.YES : ((window && window.location && window.location.hash.slice(1)) || Filter.YES);
const initUser = isServer ? null : window && window.localStorage && window.localStorage.getItem('user');
const parts = hash.split('.');
const initFilter = parts[0];
const initId = parseInt(parts[1]);
const Kills = () => {
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
    [Filter.IDK]: shuffle(_data.combos.filter(d => d.bossrush === Filter.IDK)),
    [Filter.MAYBE]: shuffle(_data.combos.filter(d => d.bossrush === Filter.MAYBE)),
    [Filter.YES]: shuffle(_data.combos.filter(d => d.bossrush === Filter.YES || d.bossrush === Filter.DEF)),
  })[filter];
  const [user, _setUser] = React.useState(initUser || null);
  const setUser = (user) => {
    if (user) {
      window.localStorage.setItem('user', user);
    } else {
      window.localStorage.removeItem('user');
    }
    return _setUser(user);
  };
  const [userInput, setUserInput] = React.useState("");
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
  const doLogin = () => setUser(userInput);
  const doLogout = () => setUserInput("") || setUser(null);
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
    () => fetch("/api/pageShuffle").then(r => r.json()).then(setData),
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
      playsInline={true}
      autoPlay=""  
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

  const doVote = (score, comboId) => {
    if (!user) { return; }
    const { focusInd, data } = R.current;
    fetch(`/api/vote`, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, comboId, name: user })
    }).then(res => res.json()).then(setData).then(() => setFocusInd(Math.max(0, Math.min(data.length - 1, focusInd + 1))))
  };
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
        const scores = {
          89: 2,
          78: -3,
          67: 0,
        };
        if (scores[keyCode] || scores[keyCode] === 0) {
          doVote(scores[keyCode], focused.id);
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
          justifyContent: "space-around",
          maxWidth: '60rem',
          flex: "0 0 2rem",
          background: "#111",
          alignItems: "center",
          alignSelf: "CENTER",
        }} >
          <div style={{ width: "1rem"}} />
          <span style={{ color: "white", fontSize: "0.75rem" }} >
            {user} • <a onClick={doLogout} style={{ cursor: 'pointer', textDecoration: 'underline', color: "grey", width: "13rem", fontSize: "0.75rem" }} >{user && 'logout'}</a>
          </span>
          <div style={{ width: "1rem"}} />
          <div className="btn-group">
            {[Filter.NEW, Filter.YES, Filter.MAYBE, Filter.IDK].map(f => {
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
          <div style={{ width: "1rem"}} />
          <span style={{ color: "white", fontSize: "0.75rem" }} >
            {all} files  ⁃  {Math.floor(1000 * processed / all) / 10}% ({processed}) processed
          </span>
          <div style={{ width: "1rem"}} />

        </div>
        <div className={styles.tableWrapper}>
        <div className={styles.tableContainer}>
        <table key={filter} className="table table-dark" >
          <thead>
            <tr>
              <th>Length</th>
              <th>Date</th>
              <th>Moves</th>
              <th>Damage</th>
              <th>Character</th>
              <th>Stage</th>
              <th>Vote</th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map((row, nth) => {
              const isActive = row.id === focusId;
              const myVote = (row.votes || {})[user] || 0;
              const isUp = myVote > 0;
              const isDown = myVote < 0;
              return (
                <tr
                  onClick={(e) => e.preventDefault() || setFocusInd(nth)} 
                  id={`row_${row.id}`}
                  key={row.id}
                  className={isActive ? 'table-active' : null}
                  style={{ background: 'rgb(33, 37, 41)' }}
                >
                  <td>{dec2(row.frames / 60)}</td>
                  <td>{(new Date(row.date)).toLocaleDateString()}</td>
                  <td>{row.moves}</td>
                  <td>{dec2(row.damage)}</td>
                  <td>{Char[row.characterId]}</td>
                  <td>{Stage[row.stageId] || "OTHER"}</td> 
                  <td style={{ position: 'relative', background: 'transparent', zIndex: 2 }} >
                    <a onClick={() => isActive && doVote(isUp ? 0 : 2, row.id)} style={{ cursor: isActive && 'pointer', opacity: isUp ? 1 : 0.33 }} >
                      👍
                    </a>
                    &nbsp;
                    &nbsp;
                    <a onClick={() => isActive && doVote(isDown ? 0 : -3, row.id)} style={{ cursor: isActive && 'pointer', opacity: isDown ? 1 : 0.33 }} >
                      👎
                    </a>
                  </td> 
                </tr>
              );})}
          </tbody>
        </table>
        </div>
        </div>
      </main>
      <Modal
        isOpen={!user}
        style={customModalStyles}
        contentLabel="Login"
      >
        <div style={{ color: 'white', padding: '1rem' }}>Enter a name to tie your votes to.</div>
        <form style={{ paddingLeft: '1rem' }}>
          <input value={userInput} onChange={e => setUserInput(e.target.value)} />
          <button onClick={doLogin} >Login</button>
        </form>
      </Modal>
    </div>
  )
}

export default Kills;
