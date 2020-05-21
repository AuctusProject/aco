import { Config } from '../common/config';
import { ERC20_THEME_NAME } from '../common/constants';
import { getLogger } from '../util/logger';

import { Theme } from './commons';
import { DefaultTheme } from './default_theme';
import { KNOWN_THEMES_META_DATA } from './theme_meta_data';

const logger = getLogger('Themes::theme_meta_data.ts');

const getThemeByName = (themeName: string): Theme => {
    const themeDataFetched = KNOWN_THEMES_META_DATA.find(themeMetaData => themeMetaData.name === themeName);
    let themeReturn = null;
    if (!themeDataFetched) {
        logger.error(`Theme with name ${themeName} not found`);
        themeReturn = new DefaultTheme();
    } else {
        themeReturn = themeDataFetched.theme;
    }
    return themeReturn;
};

export const getTheme = (): Theme => {
    const themeBase = getThemeByName(ERC20_THEME_NAME);
    const themeConfig = Config.getConfig().theme;
    const componentsTheme = themeConfig
        ? { ...themeBase.componentsTheme, ...themeConfig.componentsTheme }
        : themeBase.componentsTheme;
    const modalTheme = themeConfig
        ? {
              content: {
                  ...themeBase.modalTheme.content,
                  ...(themeConfig.modalTheme && themeConfig.modalTheme.content),
              },
              overlay: {
                  ...themeBase.modalTheme.overlay,
                  ...(themeConfig.modalTheme && themeConfig.modalTheme.overlay),
              },
          }
        : themeBase.modalTheme;
    return {
        componentsTheme,
        modalTheme,
    };
};
