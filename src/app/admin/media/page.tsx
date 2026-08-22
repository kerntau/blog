/* eslint-disable style/max-statements-per-line */
import { getMediaFiles } from '@/lib/admin'
import MediaClient from './MediaClient'

export default function MediaPage() { return <MediaClient media={getMediaFiles().slice(0, 100)} /> }
