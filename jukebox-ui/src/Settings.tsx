import { useEffect, useState } from "react"
import { albumImgByReleaseId, listArtists, updateAlbumReleaseId, updateArtistMBID, type AlbumRes, type ArtistRes } from "./api/client"

import './Settings.css'
import { listArtistReleases, type ReleaseListing } from "./api/apiClient"
import { ListingRow } from "./Library"
import { TextToCopy } from "./Common"
import { DividedContents } from "./DividedContents"

interface AritstAlbumRow {
    album: AlbumRes
}

const ArtistAlbumRow = ({ album }: AritstAlbumRow) => {
    /*
     * TODO:
     * on releaseId save, fetch the data -> save wanted things to sqlite -> no need to request data from external API often  
     * wanted at least: image data
     */

    const [albumImg, setAlbumImg] = useState<string | null>(null)

    const [isLoading, setIsLoading] = useState(false)
    const [hasMbReleaseIdSet, setHasMbReleaseIdSet] = useState(!!album.mb_release_id)
    const [mbReleaseId, setMbReleaseId] = useState<string | undefined>(album.mb_release_id)

    useEffect(() => {
        !!album.mb_release_id && albumImgByReleaseId(album.mb_release_id).then(setAlbumImg)
    }, [album.mb_release_id])

    const saveReleaseId = (album_id: number) => {
        setIsLoading(true)
        updateAlbumReleaseId(album_id, mbReleaseId).then(() => {
            setIsLoading(false)
            setHasMbReleaseIdSet(true)
        })
    }


    return (
        <div className="albumSettingRow">
            <div>
                <div>{album.title}</div>
                <div><input value={mbReleaseId} onChange={e => setMbReleaseId(e.target.value)} /><button disabled={isLoading || hasMbReleaseIdSet} onClick={() => saveReleaseId(album.id)}>Save MB_RELEASE_ID</button></div>
            </div>
            {!!albumImg && <img className="thumbnail" src={albumImg} />}
        </div>
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
                <button disabled={!hasMbidSet} onClick={() => searchReleases(mbid)}>List release groups</button>
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
    <ListingRow key={`release-${release.id}`} mainItem={<>{release.title}</>} secondaryItem={<>{release["first-release-date"]}</>} additionalItem={<TextToCopy text={release.id} />} />

type SettingsModal = 'ArtistReleases' | 'ArtistSearch'

interface ArtistReleasesProps {
    releases: ReleaseListing[]
}
const ArtistReleases = ({ releases }: ArtistReleasesProps) => {
    return (
        <div className="setting">
            <h3>Release groups</h3>
            {releases.map(a => <ArtistReleaseRow release={a} />)}
        </div>
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

    const ArtistSettings = ({ }) =>
        <div className="setting">
            <div>
                <button onClick={() => toggleMbidRequirement()}>
                    <HasMbidToggleLabel />
                </button>
            </div>
            <div>
                {artists.map(a => <ArtistSettingRow key={`artist-setting-${a.id}`} searchReleases={searchArtistReleases} artist={a} />)}
            </div>
        </div>

    return (
        <div className="settings">
            <h2>Settings</h2>
            <DividedContents
                content1={<ArtistSettings />}
                content2={<ArtistReleases releases={artistReleases} />}
            />
        </div>
    )
}

export default Settings