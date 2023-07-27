import { useEffect, useState, useRef } from "react";
import AlbumSidebar from "./components/AlbumSidebar.jsx";
import NoteModal from "./components/NoteModal.jsx";
import EditNoteModal from "./components/EditNoteModal.jsx";
import SidebarNote from "./components/SidebarNote.jsx";
import NavBar from "./components/NavBar.jsx";
import NoteArea from "./components/NoteArea.jsx";
import PlaybackBar from "./components/PlaybackBar.jsx";
import SongNoteArea from "./components/SongNoteArea.jsx";
import AlbumTab from "./components/AlbumTab.jsx";
import RecentNote from "./components/RecentNote.jsx";
import PlaybackControl from "./components/PlaybackControl.jsx";

function App() {
    const [songID, setSongID] = useState("");
    const [playbackProgress, setPlaybackProgress] = useState(-1);
    const [playbackProgressString, setPlaybackProgressString] = useState("");
    const [tempTimeStamp, setTempTimeStamp] = useState("");
    const [trackLength, setTrackLength] = useState(-1);
    const [albumCoverURL, setAlbumCoverURL] = useState("");
    const [totalTracks, setTotalTracks] = useState(-1);
    const [trackNumber, setTrackNumber] = useState(-1);
    const [songTitle, setSongTitle] = useState("");
    const [albumTitle, setAlbumTitle] = useState("");
    const [artists, setArtists] = useState([]);
    const [releaseDate, setReleaseDate] = useState("");
    const [notes, setNotes] = useState([]);
    const [scrubbing, setScrubbing] = useState(false);
    const [tracklist, setTracklist] = useState([]);
    const [albumReviews, setAlbumReviews] = useState([]);
    const [albumArtists, setAlbumArtists] = useState([]);
    const [songsWithData, setSongsWithData] = useState([]);
    const [recentData, setRecentData] = useState([]);
    const [shouldSubmit, setShouldSubmit] = useState(false);
    const [paused, setPaused] = useState(false);
    const songIDRef = useRef(songID);

    useEffect(() => {
        let sliderProgress = 0;
        function getPlaybackState() {
            console.log("Get playback state");
            const requestOptions = {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            };
            fetch("http://localhost:5000/api", requestOptions)
                .then((response) => {
                    return response.json();
                })
                .then(async (data) => {
                    if (data.uri) {
                        window.location.replace(data.uri);
                    } else {
                        try {
                            if (data.spotify_player_data.progress_ms) {
                                if (
                                    data.spotify_player_data.item.id != songID
                                ) {
                                    await submitNote();
                                    setSongID(data.spotify_player_data.item.id);
                                    let tempID =
                                        data.spotify_player_data.item.id;
                                    handleShouldSubmit(tempID);
                                    setScrubbing(false);
                                    setNotes([]);
                                    setArtists([]);
                                    setAlbumArtists([]);
                                    if (data.database_data.quickSummary) {
                                        $("#quick-summary-input").val(
                                            data.database_data.quickSummary
                                        );
                                    } else {
                                        $("#quick-summary-input").val("");
                                    }
                                    if (data.database_data.review) {
                                        $("#review-input").val(
                                            data.database_data.review
                                        );
                                    } else {
                                        $("#review-input").val("");
                                    }
                                    if (notes.length === 0) {
                                        setNotes(data.database_data.notes);
                                    }
                                }
                                setPaused(!data.spotify_player_data.is_playing);
                                setRecentData(data.recent_notes);
                                if (
                                    Math.abs(
                                        data.spotify_player_data.progress_ms -
                                            sliderProgress
                                    ) < 2000
                                ) {
                                    setScrubbing(false);
                                }
                                if (
                                    !scrubbing &&
                                    data.spotify_player_data.progress_ms
                                ) {
                                    setPlaybackProgress(
                                        data.spotify_player_data.progress_ms
                                    );
                                }
                                setPlaybackProgressString(
                                    Math.floor(
                                        (scrubbing
                                            ? sliderProgress
                                            : data.spotify_player_data
                                                  .progress_ms) /
                                            1000 /
                                            60
                                    ) +
                                        ":" +
                                        (Math.floor(
                                            ((scrubbing
                                                ? sliderProgress
                                                : data.spotify_player_data
                                                      .progress_ms) /
                                                1000) %
                                                60
                                        ) < 10
                                            ? "0"
                                            : "") +
                                        Math.floor(
                                            ((scrubbing
                                                ? sliderProgress
                                                : data.spotify_player_data
                                                      .progress_ms) /
                                                1000) %
                                                60
                                        )
                                );
                                setTrackLength(
                                    data.spotify_player_data.item.duration_ms
                                );
                                setAlbumCoverURL(
                                    data.spotify_player_data.item.album
                                        .images[0].url
                                );
                                setTotalTracks(
                                    data.spotify_player_data.item.album
                                        .total_tracks
                                );
                                setTrackNumber(
                                    data.spotify_player_data.item.track_number
                                );
                                setSongTitle(
                                    data.spotify_player_data.item.name
                                );
                                setAlbumTitle(
                                    data.spotify_player_data.item.album.name
                                );

                                if (artists.length === 0) {
                                    let tempArtists = [];
                                    data.spotify_player_data.item.artists.map(
                                        (artist) => {
                                            tempArtists.push(artist.name);
                                        }
                                    );
                                    setArtists(tempArtists);
                                }

                                if (albumArtists.length === 0) {
                                    let tempAlbumArtists = [];
                                    data.spotify_album_data.artists.map(
                                        (artist) => {
                                            tempAlbumArtists.push(artist.name);
                                        }
                                    );
                                    setAlbumArtists(tempAlbumArtists);
                                }

                                setReleaseDate(
                                    data.spotify_player_data.item.album
                                        .release_date
                                );
                                setTracklist(
                                    data.spotify_album_data.tracks.items
                                );
                                setAlbumReviews(data.album_reviews);
                                setSongsWithData(data.songs_with_data);
                            }
                        } catch (e) {
                            console.log(e);
                        }
                    }
                });
        }
        const interval = setInterval(() => getPlaybackState(), 1000);

        $(document).ready(function () {
            $(".form-range")
                .off("change")
                .on("change", async function (event) {
                    await setUserPlaybackProgress(event.currentTarget.value);
                    setPlaybackProgress(event.currentTarget.value);
                });
            $(".form-range")
                .off("input")
                .on("input", async function (event) {
                    setScrubbing(true);
                    setPlaybackProgress(event.currentTarget.value);
                    sliderProgress = event.currentTarget.value;
                });
            $('[data-bs-toggle="tooltip"]').tooltip({
                trigger: "hover",
            });
            $("#noteInterface")
                .off("shown.bs.modal")
                .on("shown.bs.modal", function () {
                    $("#timestampInput").val(
                        $("#timestampInput").prop("defaultValue")
                    );
                    $("#noteInput").focus();
                });
            $(".save-note")
                .off("click")
                .click(async function () {
                    let noteData = $(".note-form").serializeArray();
                    setNotes([
                        ...notes,
                        new Note(
                            noteData[0].value,
                            noteData[1].value,
                            noteData[2].value === ""
                                ? "(no note)"
                                : noteData[2].value
                        ),
                    ]);
                    $("#noteInput").val("");
                });
            $("#save-song-data")
                .off("click")
                .click(
                    debounce(async function () {
                        await submitNote();
                    }, 1000)
                );
            $("#noteInput")
                .off("keydown")
                .on("keydown", function (event) {
                    if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        $(".save-note").click();
                    }
                });
            notes.map((note, i) => {
                let buttonID = "#edit-note" + i;
                let formID = "#note-form" + i;
                let textareaID = "#noteInput" + i;
                $(textareaID).on("keydown", function (event) {
                    if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        $(buttonID).click();
                    }
                });
                $("#editNoteInterface" + i)
                    .off("shown.bs.modal")
                    .on("shown.bs.modal", function () {
                        $("#noteInput" + i).focus();
                    });
                $(buttonID)
                    .off("click")
                    .click(async function () {
                        let noteData = $(formID).serializeArray();
                        let editedNote = new Note(
                            noteData[0].value,
                            noteData[1].value,
                            noteData[2].value === ""
                                ? "(no note)"
                                : noteData[2].value
                        );
                        console.log(notes);
                        let tempNotesArray = notes;
                        tempNotesArray.splice(i, 0, editedNote);
                        tempNotesArray.splice(i + 1, 1);
                        setNotes(tempNotesArray);
                    });
            });
        });

        async function submitNote() {
            console.log("In submitNote. shouldSubmit is " + shouldSubmit);
            if (shouldSubmit === true) {
                setShouldSubmit(false);
                handleShouldSubmit(songID);
                const requestOptions = {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: songID,
                        quickSummary: $("#quick-summary-input").val(),
                        review: $("#review-input").val(),
                        notes: notes,
                    }),
                };
                await fetch("http://localhost:5000/api", requestOptions)
                    .then((response) => {
                        return response.json();
                    })
                    .then((data) => console.log(data));
            } else {
                console.log("Submit sent too soon. Did not submit.");
            }
        }

        return () => {
            clearInterval(interval);
        };
    }, [songID, scrubbing, artists, albumArtists, shouldSubmit, notes]);

    class Note {
        constructor(timestamp, length, note) {
            this.timestamp = timestamp;
            this.length = length;
            this.note = note;
        }
    }

    async function handleShouldSubmit(tempID) {
        setTimeout(() => {
            if (tempID === songIDRef.current) {
                setShouldSubmit(true);
            }
        }, 2000);
    }

    useEffect(() => {
        songIDRef.current = songID;
    }, [songID]);

    const debounce = (func, wait) => {
        let timeout;

        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };

            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    async function setUserPlaybackProgress(timestamp) {
        const requestOptions = {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ timeInMS: timestamp }),
        };
        await fetch("http://localhost:5000/api", requestOptions)
            .then((response) => {
                return response.json();
            })
            .then((data) => data);
    }

    async function controlPlayback() {
        const requestOptions = {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paused: paused }),
        };
        await fetch("http://localhost:5000/playback-control", requestOptions)
            .then((response) => {
                return response.json();
            })
            .then((data) => data);
    }

    function setNoteTimeStamp() {
        setTempTimeStamp(playbackProgressString);
    }

    function timestampToMilliseconds(timestamp) {
        const minutes = timestamp.split(":")[0];
        const seconds = timestamp.split(":")[1];
        return minutes * 1000 * 60 + seconds * 1000;
    }

    return (
        <>
            <div className="container">
                <NavBar />
                <div className="tab-content" id="myTabContent">
                    <div
                        className="tab-pane fade show active"
                        id="song-tab-pane"
                        role="tabpanel"
                        aria-labelledby="song-tab"
                        tabIndex="0"
                    >
                        <div className="row mt-5">
                            <div className="col-3 word-wrap">
                                <AlbumSidebar
                                    albumCoverURL={albumCoverURL}
                                    trackNumber={trackNumber}
                                    totalTracks={totalTracks}
                                    songTitle={songTitle}
                                    albumTitle={albumTitle}
                                    artists={artists}
                                    releaseDate={releaseDate}
                                />
                                {notes.map((note, i) => (
                                    <SidebarNote
                                        note={note}
                                        notes={notes}
                                        key={i}
                                        index={i}
                                        onClick={() =>
                                            setUserPlaybackProgress(
                                                timestampToMilliseconds(
                                                    note.timestamp
                                                )
                                            )
                                        }
                                    />
                                ))}
                                <h1 className="mt-5 small-text">
                                    Recently added tracks
                                </h1>
                                {recentData.map((song, i) => (
                                    <RecentNote
                                        key={i}
                                        albumCoverURL={song.album.images[0].url}
                                        songTitle={song.name}
                                        artist={song.artists[0].name}
                                    />
                                ))}
                            </div>
                            <div className="col-9 px-md-5 px-sm-3">
                                <NoteArea
                                    notes={notes}
                                    trackLength={trackLength}
                                    leftSpace={
                                        (playbackProgress / trackLength) *
                                        ($(".form-range").width() - 8 - 8)
                                    }
                                    noteOnClick={(timestamp) =>
                                        setUserPlaybackProgress(
                                            timestampToMilliseconds(timestamp)
                                        )
                                    }
                                    addNoteTimestamp={setNoteTimeStamp}
                                />
                                <div className="row">
                                    <PlaybackBar
                                        playbackProgress={playbackProgress}
                                        trackLength={trackLength}
                                        playbackProgressString={
                                            playbackProgressString
                                        }
                                    />
                                    <SongNoteArea />
                                </div>
                            </div>
                        </div>
                    </div>
                    <AlbumTab
                        albumCoverURL={albumCoverURL}
                        albumTitle={albumTitle}
                        artists={albumArtists}
                        releaseDate={releaseDate}
                        tracklist={tracklist}
                        songsWithData={songsWithData}
                        albumReviews={albumReviews}
                    />
                </div>
            </div>
            <NoteModal tempTimeStamp={tempTimeStamp} />
            {notes.map((note, i) => (
                <EditNoteModal
                    key={i}
                    index={i}
                    timestamp={note.timestamp}
                    length={note.length}
                    note={note.note}
                />
            ))}
            <PlaybackControl
                paused={paused}
                onClick={() => controlPlayback()}
            />
        </>
    );
}

export default App;
