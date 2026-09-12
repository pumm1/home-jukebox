import { useEffect, useState } from "react"
import { listArtists, updateArtistMBID, type AlbumRes, type ArtistRes } from "./api/client"

import './Settings.css'
import { listArtistReleases, type ReleaseListing } from "./api/apiClient"
import { ListingRow } from "./Library"

interface AritstAlbumRow {
    album: AlbumRes
}

const ArtistAlbumRow = ({ album }: AritstAlbumRow) => {
    const saveReleaseId = (album_id: number) => console.log(`TODO`)

    const [hasMbReleaseIdSet, setHasMbReleaseIdSet] = useState(!!album.mb_release_id)
    const [mbReleaseId, setMbReleaseId] = useState<string | undefined>(album.mb_release_id)


    return (
        <>
            <div>{album.title}</div>
            <div><input value={mbReleaseId} onChange={e => setMbReleaseId(e.target.value)} /><button disabled={album.mb_release_id !== undefined} onClick={() => saveReleaseId(album.id)}>Save MB_RELEASE_ID</button></div>
        </>
    )
}

interface ArtistSettingRowProps {
    artist: ArtistRes
    searchReleases: (mbid: string) => void
}

const ArtistSettingRow = ({ artist, searchReleases }: ArtistSettingRowProps) => {
    const [hasMbidSet, sethasMbdSet] = useState(!!artist.mbid)
    const [showAlbums, setShowAlbums] = useState(false)
    const [mbid, setMbid] = useState<string | undefined>(artist.mbid)

    const saveMBID = () => updateArtistMBID(artist.id, mbid).then(() => sethasMbdSet(true))

    return (
        <div>
            {artist.name}
            <div>
                <input placeholder="Set MBID" disabled={hasMbidSet} value={mbid} onChange={e => setMbid(e.target.value)}></input>
                <button disabled={hasMbidSet} onClick={() => saveMBID()}>Save MBID</button>
                <button disabled={!hasMbidSet} onClick={() => searchReleases(mbid)}>List releases</button>
                <button disabled={artist.albums.length <= 0} onClick={() => setShowAlbums(!showAlbums)}>Show albums</button>
                {showAlbums && artist.albums.length > 0 &&
                    <ul>
                        {artist.albums.map(a => <ArtistAlbumRow album={a} />)}
                    </ul>
                }
            </div>
        </div>
    )
}

interface ArtistReleaseRowProps {
    release: ReleaseListing
}

const ArtistReleaseRow = ({ release }: ArtistReleaseRowProps) => 
    <ListingRow mainItem={release.title} secondaryItem={release["first-release-date"]} additionalItem={release.id}/>

type SettingsModal = 'ArtistReleases' | 'ArtistSearch'

interface ArtistReleasesProps {
    releases: ReleaseListing[]
}
const ArtistReleases = ({ releases }: ArtistReleasesProps) => {
    return (
        <>
            <h3>Releases</h3>
            {releases.map(a => <ArtistReleaseRow release={a} />)}
        </>
    )
}

const Settings = ({ }) => {
    const [hasMbid, setHasMbid] = useState<boolean | undefined>(undefined)
    const [artists, setArtists] = useState<ArtistRes[]>([])

    const [artistReleases, setArtistReleases] = useState<ReleaseListing[]>([])

    const searchArtistReleases = (mbid: string) =>
        listArtistReleases(mbid).then(setArtistReleases)


    const toggleMbidRequirement = () => {
        hasMbid === undefined ? setHasMbid(true) : hasMbid ? setHasMbid(false) : setHasMbid(undefined)
    }

    const HasMbidToggleLabel = ({ }) =>
        hasMbid === undefined ? 'Require MBID' : hasMbid ? 'No MBID' : 'All'

    useEffect(() => {
        listArtists(hasMbid).then(setArtists)
    }, [hasMbid])

    return (
        <div>
            <h2>Settings</h2>
            <div className="settingsColumns">
                <div className="settingsColumn">
                    <div>
                        <button onClick={() => toggleMbidRequirement()}>
                            <HasMbidToggleLabel />
                        </button>
                    </div>
                    <div>
                        {artists.map(a => <ArtistSettingRow searchReleases={searchArtistReleases} artist={a} />)}
                    </div>
                </div>
                <div className="settingsColumn">
                    <ArtistReleases releases={artistReleases} />
                </div>
            </div>
        </div>
    )
}

export default Settings