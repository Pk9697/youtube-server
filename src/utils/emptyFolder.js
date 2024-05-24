/* eslint-disable no-restricted-syntax */
import * as fsExtra from 'fs-extra'

export const emptyFolder = (fileDir) => {
  fsExtra.emptyDir(fileDir)
}
