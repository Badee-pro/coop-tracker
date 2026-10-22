import * as server from './serverApi'
import * as browser from './browserStore'

const store = import.meta.env.VITE_STORAGE === 'browser' ? browser : server

export const usesBrowserStorage = store === browser

export const listApplications = () => store.listApplications()
export const createApplication = (attrs) => store.createApplication(attrs)
export const updateApplication = (id, attrs) => store.updateApplication(id, attrs)
export const deleteApplication = (id) => store.deleteApplication(id)
export const getSyncStatus = () => store.getSyncStatus()
export const importWaterlooWorksItems = (items) => store.importWaterlooWorksItems(items)
