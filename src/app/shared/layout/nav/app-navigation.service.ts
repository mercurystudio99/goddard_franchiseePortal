import { SiteMarketingToolsConstants } from '../../../site-marketing-tools/site-marketing-tools-constants';
import { PermissionCheckerService } from 'abp-ng2-module';
import { AppSessionService } from '@shared/common/session/app-session.service';

import { Injectable } from '@angular/core';
import { AppMenu } from './app-menu';
import { AppMenuItem } from './app-menu-item';

import { SiteEditorConstants } from '@app/site-editor/site-editor.constants';
import { ToursEditorConstants } from '@app/tours-editor/tours-editor-constants';

@Injectable()
export class AppNavigationService {
    constructor(
        private _permissionCheckerService: PermissionCheckerService,
        private _appSessionService: AppSessionService
    ) {}

    getMenu(): AppMenu {
        return new AppMenu('MainMenu', 'MainMenu', [
            /*new AppMenuItem('Dashboard', 'Pages.Administration.Host.Dashboard', 'flaticon-line-graph', '/app/admin/hostDashboard'),*/
            new AppMenuItem(
                'iGoddard Home',
                '',
                'flaticon-line-graph',
                '/app/main/dashboard',
                [],
                [new AppMenuItem('Dashboard', 'Pages.Tenant.Dashboard', 'flaticon-suitcase', '/app/main/dashboard')]
            ),
            new AppMenuItem(
                'School Site Editor',
                '',
                '',
                SiteEditorConstants.EDIT_HOME_PAGE_URL,
                [],
                [
                    new AppMenuItem('Home Page', '', '', SiteEditorConstants.EDIT_HOME_PAGE_URL),
                    new AppMenuItem('Features', '', '', SiteEditorConstants.EDIT_FEATURES_PAGE_URL),
                    new AppMenuItem('Faculty Bios', '', '', SiteEditorConstants.EDIT_FACULTY_PAGE_URL),
                    new AppMenuItem(
                        'Testimonials',
                        '',
                        '',
                        SiteEditorConstants.EDIT_TESTIMONIALS_PUBLISHED_PAGE_URL,
                        [],
                        [
                            new AppMenuItem(
                                'Published',
                                '',
                                '',
                                SiteEditorConstants.EDIT_TESTIMONIALS_PUBLISHED_PAGE_URL
                            ),
                            new AppMenuItem(
                                'UnPublished',
                                '',
                                '',
                                SiteEditorConstants.EDIT_TESTIMONIALS_UNPUBLISHED_PAGE_URL
                            ),
                        ]
                    ),
                    new AppMenuItem('Careers', '', '', SiteEditorConstants.EDIT_CAREERS_PAGE_URL),
                    new AppMenuItem(
                        'School Events',
                        '',
                        '',
                        SiteEditorConstants.EDIT_EVENTS_PAGE_URL,
                        [],
                        [
                            new AppMenuItem('Calendar', '', '', SiteEditorConstants.EDIT_EVENTS_CALENDAR_PAGE_URL),
                            new AppMenuItem('Templates', '', '', SiteEditorConstants.EDIT_EVENTS_TEMPLATES_PAGE_URL),
                        ]
                    ),
                    new AppMenuItem('Summer Calendars', '', '', SiteEditorConstants.EDIT_SUMMER_CAMP_PAGE_URL),
                ]
            ),
            new AppMenuItem(
                'Leads Management',
                '',
                '',
                ToursEditorConstants.MANAGE_TOURS_PAGE_URL,
                [],
                [
                    new AppMenuItem('Manage Tours', '', '', ToursEditorConstants.MANAGE_TOURS_PAGE_URL),
                    new AppMenuItem('Completed Tours', '', '', ToursEditorConstants.COMPLETED_TOURS_PAGE_URL),
                    new AppMenuItem('Manage Availability', '', '', ToursEditorConstants.TOURS_AVAILABILITY_PAGE_URL),
                ],
                false,
                undefined,
                (): boolean => {
                    //20220531: hide/show Tours menu
                    return abp.features.isEnabled('App.Tours');
                }
            ),
            new AppMenuItem(
                'Marketing Tools',
                '',
                '',
                SiteMarketingToolsConstants.MARKETING_FOCUS_PAGE_URL,
                [],
                [
                    new AppMenuItem('Marketing Focus', '', '', SiteMarketingToolsConstants.MARKETING_FOCUS_PAGE_URL),
                    new AppMenuItem('Social Media', '', '', SiteMarketingToolsConstants.SOCIAL_MEDIA_PAGE_URL),
                    new AppMenuItem('Email Marketing', '', '', SiteMarketingToolsConstants.EMAIL_MARKETING_PAGE_URL),
                    new AppMenuItem('Local Marketing', '', '', SiteMarketingToolsConstants.LOCAL_MEDIA_PAGE_URL),
                    new AppMenuItem(
                        'Marketing Collateral',
                        '',
                        '',
                        SiteMarketingToolsConstants.MARKETING_COLLATERAL_PAGE_URL
                    ),
                    new AppMenuItem('Goddard Family Voice', '', '', SiteMarketingToolsConstants.FAMILY_VOICE_PAGE_URL),
                ],
                false,
                undefined,
                (): boolean => {
                    //20230406: hide/show Marketing Tools menu
                    return abp.features.isEnabled('App.SiteMarketingTools');
                }
            ),
            /* new AppMenuItem('Tenants', 'Pages.Tenants', 'flaticon-list-3', '/app/admin/tenants'),
            new AppMenuItem('Editions', 'Pages.Editions', 'flaticon-app', '/app/admin/editions'),*/
            new AppMenuItem(
                'Administration',
                '',
                'flaticon-interface-8',
                '/app/admin/organization-units',
                [],
                [
                    new AppMenuItem(
                        'OrganizationUnits',
                        'Pages.Administration.OrganizationUnits',
                        'flaticon-map',
                        '/app/admin/organization-units'
                    ),
                    new AppMenuItem('Roles', 'Pages.Administration.Roles', 'flaticon-suitcase', '/app/admin/roles'),
                    new AppMenuItem('Users', 'Pages.Administration.Users', 'flaticon-users', '/app/admin/users'),
                    new AppMenuItem(
                        'Insights & Updates',
                        'Pages.Administration.Insights',
                        'flaticon-more',
                        '/app/admin/insights'
                    ),
                    new AppMenuItem(
                        'Settings',
                        'Pages.Administration.Tenant.Settings',
                        'flaticon-settings',
                        '/app/admin/tenantSettings'
                    ),
                    new AppMenuItem(
                        'Languages',
                        'Pages.Administration.Languages',
                        'flaticon-tabs',
                        '/app/admin/languages',
                        ['/app/admin/languages/{name}/texts']
                    ),
                    new AppMenuItem(
                        'AuditLogs',
                        'Pages.Administration.AuditLogs',
                        'flaticon-folder-1',
                        '/app/admin/auditLogs'
                    ),
                    new AppMenuItem(
                        'Maintenance',
                        'Pages.Administration.Host.Maintenance',
                        'flaticon-lock',
                        '/app/admin/maintenance'
                    ),
                    new AppMenuItem(
                        'Subscription',
                        'Pages.Administration.Tenant.SubscriptionManagement',
                        'flaticon-refresh',
                        '/app/admin/subscription-management'
                    ),
                    new AppMenuItem(
                        'VisualSettings',
                        'Pages.Administration.UiCustomization',
                        'flaticon-medical',
                        '/app/admin/ui-customization'
                    ),
                    new AppMenuItem(
                        'WebhookSubscriptions',
                        'Pages.Administration.WebhookSubscription',
                        'flaticon2-world',
                        '/app/admin/webhook-subscriptions'
                    ),
                    new AppMenuItem(
                        'DynamicProperties',
                        'Pages.Administration.DynamicProperties',
                        'flaticon-interface-8',
                        '/app/admin/dynamic-property'
                    ),
                    new AppMenuItem(
                        'Settings',
                        'Pages.Administration.Host.Settings',
                        'flaticon-settings',
                        '/app/admin/hostSettings'
                    ),
                ]
            ),
        ]);
    }

    checkChildMenuItemPermission(menuItem): boolean {
        for (let i = 0; i < menuItem.items.length; i++) {
            let subMenuItem = menuItem.items[i];

            if (subMenuItem.permissionName === '' || subMenuItem.permissionName === null) {
                if (subMenuItem.route) {
                    return true;
                }
            } else if (this._permissionCheckerService.isGranted(subMenuItem.permissionName)) {
                return true;
            }

            if (subMenuItem.items && subMenuItem.items.length) {
                let isAnyChildItemActive = this.checkChildMenuItemPermission(subMenuItem);
                if (isAnyChildItemActive) {
                    return true;
                }
            }
        }
        return false;
    }

    showMenuItem(menuItem: AppMenuItem): boolean {
        if (
            menuItem.permissionName === 'Pages.Administration.Tenant.SubscriptionManagement' &&
            this._appSessionService.tenant &&
            !this._appSessionService.tenant.edition
        ) {
            return false;
        }

        let hideMenuItem = false;

        if (menuItem.requiresAuthentication && !this._appSessionService.user) {
            hideMenuItem = true;
        }

        if (menuItem.permissionName && !this._permissionCheckerService.isGranted(menuItem.permissionName)) {
            hideMenuItem = true;
        }

        if (this._appSessionService.tenant || !abp.multiTenancy.ignoreFeatureCheckForHostUsers) {
            if (menuItem.hasFeatureDependency() && !menuItem.featureDependencySatisfied()) {
                hideMenuItem = true;
            }
        }

        if (!hideMenuItem && menuItem.items && menuItem.items.length) {
            return this.checkChildMenuItemPermission(menuItem);
        }

        return !hideMenuItem;
    }

    /**
     * Returns all menu items recursively
     */
    getAllMenuItems(): AppMenuItem[] {
        let menu = this.getMenu();
        let allMenuItems: AppMenuItem[] = [];
        menu.items.forEach((menuItem) => {
            allMenuItems = allMenuItems.concat(this.getAllMenuItemsRecursive(menuItem));
        });

        return allMenuItems;
    }

    private getAllMenuItemsRecursive(menuItem: AppMenuItem): AppMenuItem[] {
        if (!menuItem.items) {
            return [menuItem];
        }

        let menuItems = [menuItem];
        menuItem.items.forEach((subMenu) => {
            menuItems = menuItems.concat(this.getAllMenuItemsRecursive(subMenu));
        });

        return menuItems;
    }
}
