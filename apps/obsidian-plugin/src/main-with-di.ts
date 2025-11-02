import { Notice, Plugin } from 'obsidian'
import {
  asstTagCmd,
  exportCmd,
  getMeta,
  getTagCmdIdsFromSettings,
  newChatTagCmd,
  replaceCmd,
  selectMsgAtCursorCmd,
  systemTagCmd,
  userTagCmd,
} from './commands'
import type { RequestController } from './editor'
import { t } from './lang/helper'
import { getTitleFromCmdId, loadTemplateFileCommand, promptTemplateCmd, templateToCmdId } from './prompt'
import { DEFAULT_SETTINGS, type PluginSettings } from './settings'
import { TarsSettingTab } from './settingTab'
import { StatusBarManager } from './statusBarManager'
import { getMaxTriggerLineLength, TagEditorSuggest, type TagEntry } from './suggest'
import { ensureWorkspacePackageUsage } from './workspace-usage'

// DI imports
import { setupDIContainer, disposeDIContainer, getDIContainer } from './di/setup'
import { SettingsFacade } from './di/settings-facade'
import { ProviderFacade } from './di/provider-facade'
import type { Container } from '@needle-di/core'

export default class TarsPlugin extends Plugin {
  settings!: PluginSettings
  statusBarManager!: StatusBarManager
  tagCmdIds: string[] = []
  promptCmdIds: string[] = []
  tagLowerCaseMap: Map<string, Omit<TagEntry, 'replacement'>> = new Map()
  aborterInstance: AbortController | null = null

  // DI-related properties
  private diContainer!: Container
  private settingsFacade!: SettingsFacade
  private providerFacade!: ProviderFacade

  async onload() {
    await this.loadSettings()

    console.debug('loading Tars plugin with DI...')
    ensureWorkspacePackageUsage()

    // Setup DI container
    try {
      this.diContainer = await setupDIContainer(this.app, this.settings)
      this.settingsFacade = new SettingsFacade()
      this.providerFacade = new ProviderFacade()

      console.debug('DI container setup completed successfully')
    } catch (error) {
      console.error('Failed to setup DI container, falling back to legacy mode:', error)
      // Fallback to legacy mode if DI setup fails
      this.setupLegacyMode()
      return
    }

    const statusBarItem = this.addStatusBarItem()
    this.statusBarManager = new StatusBarManager(this.app, statusBarItem)

    this.buildTagCommands(true)
    this.buildPromptCommands(true)

    this.addCommand(selectMsgAtCursorCmd(this.app, this.settings))
    this.addCommand(
      loadTemplateFileCommand(
        this.app,
        this.settings,
        () => this.saveSettings(),
        () => this.buildPromptCommands()
      )
    )

    this.settings.editorStatus = { isTextInserting: false }

    if (this.settings.enableTagSuggest)
      this.registerEditorSuggest(
        new TagEditorSuggest(
          this.app,
          this.settings,
          this.tagLowerCaseMap,
          this.statusBarManager,
          this.getRequestController()
        )
      )

    this.addCommand({
      id: 'cancelGeneration',
      name: t('Cancel generation'),
      callback: async () => {
        this.settings.editorStatus.isTextInserting = false

        if (this.aborterInstance === null) {
          new Notice(t('No active generation to cancel'))
          return
        }
        if (this.aborterInstance.signal.aborted) {
          new Notice(t('Generation already cancelled'))
          return
        }

        this.aborterInstance.abort()
      },
    })

    if (this.settings.enableReplaceTag) this.addCommand(replaceCmd(this.app))
    if (this.settings.enableExportToJSONL) this.addCommand(exportCmd(this.app, this.settings))

    this.addSettingTab(new TarsSettingTab(this.app, this))

    // Setup settings change listener
    this.setupSettingsChangeListener()

    console.debug('Tars plugin loaded successfully with DI')
  }

  onunload() {
    this.statusBarManager?.dispose()

    // Dispose DI resources
    try {
      this.settingsFacade?.dispose()
      this.providerFacade?.dispose()
      disposeDIContainer()
      console.debug('DI resources disposed successfully')
    } catch (error) {
      console.error('Error disposing DI resources:', error)
    }
  }

  /**
   * Setup legacy mode fallback if DI setup fails
   */
  private setupLegacyMode(): void {
    console.debug('Setting up legacy mode (DI unavailable)')

    const statusBarItem = this.addStatusBarItem()
    this.statusBarManager = new StatusBarManager(this.app, statusBarItem)

    this.buildTagCommands(true)
    this.buildPromptCommands(true)

    this.addCommand(selectMsgAtCursorCmd(this.app, this.settings))
    this.addCommand(
      loadTemplateFileCommand(
        this.app,
        this.settings,
        () => this.saveSettings(),
        () => this.buildPromptCommands()
      )
    )

    this.settings.editorStatus = { isTextInserting: false }

    if (this.settings.enableTagSuggest)
      this.registerEditorSuggest(
        new TagEditorSuggest(
          this.app,
          this.settings,
          this.tagLowerCaseMap,
          this.statusBarManager,
          this.getRequestController()
        )
      )

    this.addCommand({
      id: 'cancelGeneration',
      name: t('Cancel generation'),
      callback: async () => {
        this.settings.editorStatus.isTextInserting = false

        if (this.aborterInstance === null) {
          new Notice(t('No active generation to cancel'))
          return
        }
        if (this.aborterInstance.signal.aborted) {
          new Notice(t('Generation already cancelled'))
          return
        }

        this.aborterInstance.abort()
      },
    })

    if (this.settings.enableReplaceTag) this.addCommand(replaceCmd(this.app))
    if (this.settings.enableExportToJSONL) this.addCommand(exportCmd(this.app, this.settings))

    this.addSettingTab(new TarsSettingTab(this.app, this))
  }

  /**
   * Setup settings change listener using the SettingsFacade
   */
  private setupSettingsChangeListener(): void {
    if (!this.settingsFacade) return

    this.settingsFacade.onSettingsChanged((event) => {
      console.debug('Settings changed via facade:', event.changeId)

      // Update local settings reference
      this.settings = event.newSettings

      // Rebuild commands if providers changed
      if (event.changes.providers) {
        this.buildTagCommands()
        this.buildPromptCommands()

        // Refresh provider facade
        try {
          this.providerFacade.refreshAllProviders()
        } catch (error) {
          console.error('Error refreshing providers:', error)
        }
      }

      // Handle general settings changes
      if (event.changes.general) {
        for (const change of event.changes.general) {
          if (change.path === 'enableTagSuggest' || change.path === 'tagSuggestMaxLineLength') {
            // Rebuild tag suggestions if settings changed
            this.buildTagCommands()
          }
        }
      }
    })
  }

  /**
   * Get settings facade for external access
   */
  getSettingsFacade(): SettingsFacade | null {
    return this.settingsFacade || null
  }

  /**
   * Get provider facade for external access
   */
  getProviderFacade(): ProviderFacade | null {
    return this.providerFacade || null
  }

  /**
   * Get DI container for advanced usage
   */
  getDIContainer(): Container | null {
    try {
      return getDIContainer()
    } catch {
      return null
    }
  }

  /**
   * Check if DI mode is active
   */
  isDIMode(): boolean {
    return !!(this.diContainer && this.settingsFacade && this.providerFacade)
  }

  addTagCommand(cmdId: string) {
    const tagCmdMeta = getMeta(cmdId)
    switch (tagCmdMeta.role) {
      case 'newChat':
        this.addCommand(newChatTagCmd(tagCmdMeta))
        break
      case 'system':
        this.addCommand(systemTagCmd(tagCmdMeta, this.app, this.settings))
        break
      case 'user':
        this.addCommand(userTagCmd(tagCmdMeta, this.app, this.settings))
        break
      case 'assistant':
        this.addCommand(
          asstTagCmd(tagCmdMeta, this.app, this.settings, this.statusBarManager, this.getRequestController())
        )
        break
      default:
        throw new Error('Unknown tag role')
    }
  }

  buildTagCommands(suppressNotifications: boolean = false) {
    this.settings.tagSuggestMaxLineLength = getMaxTriggerLineLength(this.settings)

    const newTagCmdIds = getTagCmdIdsFromSettings(this.settings)

    const toRemove = this.tagCmdIds.filter(cmdId => !newTagCmdIds.includes(cmdId))
    toRemove.forEach(cmdId => {
      this.removeCommand(cmdId)
      const { tag } = getMeta(cmdId)
      this.tagLowerCaseMap.delete(tag.toLowerCase())
    })

    const toAdd = newTagCmdIds.filter(cmdId => !this.tagCmdIds.includes(cmdId))
    toAdd.forEach(cmdId => {
      this.addTagCommand(cmdId)
      const { role, tag } = getMeta(cmdId)
      this.tagLowerCaseMap.set(tag.toLowerCase(), { role, tag })
    })

    this.tagCmdIds = newTagCmdIds
    if (suppressNotifications) return

    const removedTags = toRemove.map(cmdId => getMeta(cmdId).tag)
    if (removedTags.length > 0) {
      console.debug('Removed commands', removedTags)
      new Notice(`${t('Removed commands')}: ${removedTags.join(', ')}`)
    }
    const addedTags = toAdd.map(cmdId => getMeta(cmdId).tag)
    if (addedTags.length > 0) {
      console.debug('Added commands', addedTags)
      new Notice(`${t('Added commands')}: ${addedTags.join(', ')}`)
    }
  }

  buildPromptCommands(suppressNotifications: boolean = false) {
    const newPromptCmdIds = this.settings.promptTemplates.map(templateToCmdId)

    const toRemove = this.promptCmdIds.filter(cmdId => !newPromptCmdIds.includes(cmdId))
    toRemove.forEach(cmdId => {
      this.removeCommand(cmdId)
    })

    const toAdd = this.settings.promptTemplates.filter(t => !this.promptCmdIds.includes(templateToCmdId(t)))
    toAdd.forEach(t => {
      this.addCommand(promptTemplateCmd(templateToCmdId(t), t.title, this.app, this.settings))
    })

    this.promptCmdIds = newPromptCmdIds
    if (suppressNotifications) return

    const removedTitles = toRemove.map(cmdId => getTitleFromCmdId(cmdId))
    if (removedTitles.length > 0) {
      console.debug('Removed commands', removedTitles)
      new Notice(`${t('Removed commands')}: ${removedTitles.join(', ')}`)
    }
    const addedTitles = toAdd.map(t => t.title)
    if (addedTitles.length > 0) {
      console.debug('Added commands', addedTitles)
      new Notice(`${t('Added commands')}: ${addedTitles.join(', ')}`)
    }
  }

  getRequestController(): RequestController {
    return {
      getController: () => {
        if (!this.aborterInstance) {
          this.aborterInstance = new AbortController()
        }
        return this.aborterInstance
      },
      cleanup: () => {
        this.settings.editorStatus.isTextInserting = false
        this.aborterInstance = null
      },
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
  }

  async saveSettings() {
    await this.saveData(this.settings)

    // Notify facades of settings change
    if (this.settingsFacade) {
      // The facade will handle its own change detection and notification
      // This ensures consistency between direct settings access and facade-managed state
    }
  }

  /**
   * Enhanced settings save using facades when available
   */
  async saveSettingsWithFacades(settingsUpdate?: Partial<PluginSettings>): Promise<void> {
    if (this.settingsFacade && settingsUpdate) {
      // Use facade for updates when available
      if (settingsUpdate.editorStatus !== undefined) {
        this.settingsFacade.setEditorStatus(settingsUpdate.editorStatus)
      }
      if (settingsUpdate.systemTags) {
        this.settingsFacade.setSystemTags(settingsUpdate.systemTags)
      }
      if (settingsUpdate.userTags) {
        this.settingsFacade.setUserTags(settingsUpdate.userTags)
      }
      if (settingsUpdate.defaultSystemMsg !== undefined) {
        this.settingsFacade.setDefaultSystemMsg(settingsUpdate.defaultSystemMsg)
      }
      if (settingsUpdate.providers) {
        this.settingsFacade.setProviders(settingsUpdate.providers)
      }
    } else {
      // Fallback to direct settings update
      if (settingsUpdate) {
        Object.assign(this.settings, settingsUpdate)
      }
    }

    await this.saveSettings()
  }
}