import { describe, expect, it } from 'vitest'
import { UploadId } from './ids.ts'
import { CompleteUploadRequest, CompleteUploadResponse, StartUploadRequest, StartUploadResponse } from './uploads.ts'

const id = 'AbCdEfGhIjKlMnOpQr_-12'

describe('upload IDs', () => {
  it('takes 22 characters of base64url only', () => {
    expect(UploadId.safeParse(id).success).toBe(true)
    expect(UploadId.safeParse(id.slice(1)).success).toBe(false)
    expect(UploadId.safeParse('AbCdEfGhIjKlMnOpQr/+12').success).toBe(false)
  })
})

describe('StartUploadRequest', () => {
  it('takes a name, a size of 1 byte or more and a type, which may be empty', () => {
    expect(StartUploadRequest.safeParse({ name: 'photo.heic', size: 1, type: '' }).success).toBe(true)
    expect(StartUploadRequest.safeParse({ name: '', size: 1, type: '' }).success).toBe(false)
    expect(StartUploadRequest.safeParse({ name: 'a', size: 0, type: '' }).success).toBe(false)
    expect(StartUploadRequest.safeParse({ name: 'a', size: 1.5, type: '' }).success).toBe(false)
  })

  it('takes no other field, such as a path', () => {
    expect(StartUploadRequest.safeParse({ name: 'a', size: 1, type: '', path: '/home/dev/a' }).success).toBe(false)
  })
})

describe('upload answers', () => {
  it('give the upload and its chunk size, then the attachment', () => {
    expect(StartUploadResponse.parse({ upload: id, chunkSize: 8_388_608 })).toEqual({
      upload: id,
      chunkSize: 8_388_608,
    })
    expect(CompleteUploadResponse.parse({ attachment: id })).toEqual({ attachment: id })
    expect(CompleteUploadRequest.safeParse({ attachment: id }).success).toBe(false)
  })
})
