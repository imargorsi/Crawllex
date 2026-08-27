export interface Translation {
  layout: {
    appName: string;
  };
  projectSelector: {
    triggerLabel: string;
    listLabel: string;
    listHeading: string;
    cardLabel: string;
    emptyLabel: string;
    selectPrompt: string;
  };
  nav: {
    aria: string;
    openMenu: string;
    closeMenu: string;
    collapseSidebar: string;
    expandSidebar: string;
    groupGeneral: string;
    groupReporting: string;
    groupSettings: string;
    dashboard: string;
    users: string;
    rolesPermissions: string;
    projects: string;
    analytics: string;
    seoActivities: string;
    leads: string;
    settings: string;
  };
  breadcrumb: {
    /** First crumb linking to `/dashboard` on nested pages */
    root: string;
    new: string;
    edit: string;
  };
  table: {
    emptyTitle: string;
    emptyBody: string;
    loading: string;
  };
  ui: {
    close: string;
    error: {
      title: string;
      description: string;
      tryAgain: string;
      goHome: string;
    };
  };
  form: {
    showPassword: string;
    hidePassword: string;
    pickImage: string;
    changeImage: string;
    fileTooLarge: string;
    searchCountry: string;
    noCountriesFound: string;
    removeChip: string;
  };
  userMenu: {
    openMenu: string;
    menuLabel: string;
    settings: string;
    editProfile: string;
    changePassword: string;
    logOut: string;
    fallbackName: string;
    noEmail: string;
    emailVerified: string;
    emailNotVerified: string;
    resendVerification: string;
  };
  settings: {
    title: string;
    subtitle: string;
    emptyTitle: string;
    emptyBody: string;
    categoriesHeading: string;
    categories: {
      theme: string;
      integrations: string;
    };
    themePacks: {
      sectionTitle: string;
      lead: string;
      selected: string;
      saveErrorFallback: string;
      default: string;
      defaultDescription: string;
      "glass-aurora": string;
      "glass-auroraDescription": string;
      "verdant-grove": string;
      "verdant-groveDescription": string;
      "lumen-slate": string;
      "lumen-slateDescription": string;
    };
    fontPacks: {
      sectionTitle: string;
      lead: string;
      selected: string;
      saveErrorFallback: string;
      jakarta: string;
      jakartaDescription: string;
      ubuntu: string;
      ubuntuDescription: string;
      nunito: string;
      nunitoDescription: string;
      inter: string;
      interDescription: string;
    };
    integrations: {
      lead: string;
      projectContext: string;
      selectProjectTitle: string;
      selectProjectBody: string;
      refresh: string;
      connect: string;
      update: string;
      disconnect: string;
      propertyLabel: string;
      propertyPlaceholder: string;
      propertyRequired: string;
      gscPropertyPlaceholder: string;
      ga4PropertyPlaceholder: string;
      lastSynced: string;
      connectSuccess: string;
      connectError: string;
      updateSuccess: string;
      updateError: string;
      disconnectSuccess: string;
      disconnectError: string;
      syncSuccess: string;
      syncError: string;
      refreshSuccess: string;
      refreshError: string;
      confirmCancel: string;
      confirmConnectTitle: string;
      confirmConnectBody: string;
      confirmConnect: string;
      confirmUpdateTitle: string;
      confirmUpdateBody: string;
      confirmUpdate: string;
      confirmDisconnectTitle: string;
      confirmDisconnectBody: string;
      confirmDisconnect: string;
      confirmRefreshTitle: string;
      confirmRefreshBody: string;
      confirmRefresh: string;
      analyticsTitle: string;
      analyticsLead: string;
      leadsTitle: string;
      leadsLead: string;
      services: {
        gsc: string;
        ga4: string;
        wordpress: string;
      };
      serviceLead: {
        gsc: string;
        ga4: string;
      };
      status: {
        connected: string;
        disconnected: string;
        error: string;
      };
      wordpress: {
        title: string;
        lead: string;
        connect: string;
        viewKey: string;
        viewKeyError: string;
        disconnect: string;
        downloadPlugin: string;
        downloadError: string;
        siteUrlPending: string;
        connectedAt: string;
        lastVerified: string;
        ingestStats: string;
        inactiveProject: string;
        loadError: string;
        connectSuccess: string;
        connectError: string;
        disconnectSuccess: string;
        disconnectError: string;
        confirmConnectTitle: string;
        confirmConnectBody: string;
        confirmConnect: string;
        confirmDisconnectTitle: string;
        confirmDisconnectBody: string;
        confirmDisconnect: string;
        keyDialogTitle: string;
        keyDialogLead: string;
        keyLabel: string;
        copyKey: string;
        keyCopied: string;
        copyError: string;
        done: string;
      };
    };
  };
  profile: {
    changePassword: {
      title: string;
      lead: string;
      currentPassword: string;
      currentPasswordPh: string;
      newPassword: string;
      newPasswordPh: string;
      confirmPassword: string;
      confirmPasswordPh: string;
      submit: string;
      submitting: string;
      successTitle: string;
      successFallback: string;
      errorTitle: string;
      errorFallback: string;
      valRequired: string;
      valMin: string;
      valMatch: string;
      cancel: string;
    };
    edit: {
      breadcrumbTitle: string;
      title: string;
      lead: string;
      loading: string;
      loadErrorTitle: string;
      loadErrorBody: string;
      saving: string;
      save: string;
      successTitle: string;
      successFallback: string;
      errorTitle: string;
      errorFallback: string;
      nameLabel: string;
      namePh: string;
      valRequired: string;
      valMin: string;
      valMax: string;
      photoLabel: string;
      photoHint: string;
      photoPick: string;
      photoChange: string;
      photoClear: string;
      noChanges: string;
      sectionReadonly: string;
      emailLabel: string;
      rolesHeading: string;
      permissionsHeading: string;
      noRoles: string;
      noPermissions: string;
      linkChangePassword: string;
    };
  };
  home: {
    title: string;
    subtitle: string;
    selectProjectTitle: string;
    selectProjectBody: string;
    loadError: string;
    dateFilterAriaLabel: string;
    export: {
      excel: string;
      success: string;
      empty: string;
      errorFallback: string;
      metric: string;
      value: string;
      date: string;
      sessions: string;
      sheets: {
        summary: string;
        dailyTrend: string;
      };
    };
    pulse: {
      title: string;
      cards: {
        leads: string;
        backlinks: string;
        pageViews: string;
        blogs: string;
      };
      descriptions: {
        leads: string;
        backlinks: string;
        pageViews: string;
        blogs: string;
        unavailable: string;
      };
    };
    trend: {
      title: string;
      subtitle: string;
      gridAria: string;
      emptyTitle: string;
      emptyBody: string;
      noSeries: string;
      descriptions: {
        clicks: string;
        impressions: string;
        ctr: string;
        position: string;
        engagementRate: string;
        avgSessionDuration: string;
        unavailable: string;
      };
      cards: {
        clicks: string;
        impressions: string;
        ctr: string;
        position: string;
        engagementRate: string;
        avgSessionDuration: string;
      };
      direction: {
        up: string;
        down: string;
        flat: string;
      };
    };
    assistant: {
      title: string;
      greeting: string;
      greetingFallback: string;
      description: string;
      descriptionShort: string;
      placeholder: string;
      inputLabel: string;
      submit: string;
      asking: string;
      suggestionsLabel: string;
      popularTitle: string;
      historyLabel: string;
      historyLoading: string;
      answerLabel: string;
      emptyAnswer: string;
      queryError: string;
      tipTitle: string;
      tipBody: string;
      suggestions: {
        leadsThisMonth: string;
        leadsLastMonth: string;
        leadsThisYear: string;
        analyticsOverview: string;
        topQueries: string;
        topPages: string;
        blogs: string;
        backlinks: string;
        technicalWork: string;
      };
    };
  };
  modules: {
    users: {
      title: string;
      subtitle: string;
      createUserTitle: string;
      createLead: string;
      editUserTitle: string;
      editLead: string;
      createForm: {
        profileImage: string;
        profileImageHint: string;
        profileImageUploadLabel: string;
        profileImageChangeLabel: string;
        name: string;
        namePh: string;
        email: string;
        emailPh: string;
        password: string;
        passwordPh: string;
        passwordPhEdit: string;
        passwordConfirmation: string;
        passwordConfirmationPh: string;
        passwordConfirmationPhEdit: string;
        submit: string;
        submitting: string;
        editSubmit: string;
        editSubmitting: string;
        backToList: string;
        valRequired: string;
        valEmail: string;
        valMinPassword: string;
        valPasswordMatch: string;
        valMax: string;
        successFallback: string;
        errorFallback: string;
        editSuccessFallback: string;
        editErrorFallback: string;
        membershipAssignError: string;
      };
      memberships: {
        title: string;
        lead: string;
        count: string;
        empty: string;
        projectLabel: string;
        projectPh: string;
        roleLabel: string;
        rolePh: string;
        add: string;
        addTitle: string;
        addLead: string;
        save: string;
        saving: string;
        removeAria: string;
        statusInvited: string;
        assignSuccess: string;
        assignError: string;
        updateSuccess: string;
        updateError: string;
        removeSuccess: string;
        removeError: string;
        confirmUpdateTitle: string;
        confirmUpdateBody: string;
        confirmUpdate: string;
        confirmRemoveTitle: string;
        confirmRemoveBody: string;
        confirmRemove: string;
        confirmCancel: string;
      };
      assignments: {
        noProjects: string;
        membershipOwner: string;
        membershipMember: string;
        membershipInvited: string;
        projectStatus: {
          pending: string;
          active: string;
          inactive: string;
          rejected: string;
        };
      };
      detail: {
        title: string;
        lead: string;
        accountTitle: string;
        accountLead: string;
        email: string;
        accountSource: string;
        accountSourceUnknown: string;
        createdAt: string;
        updatedAt: string;
        emailVerifiedAt: string;
        emailNotVerified: string;
        projectsTitle: string;
        projectsLead: string;
      };
      accountSource: {
        admin: string;
        self_register: string;
        google: string;
      };
      accountSourceFilter: {
        ariaLabel: string;
        label: string;
        all: string;
      };
      statusFilter: {
        ariaLabel: string;
        all: string;
        active: string;
        inactive: string;
      };
      table: {
        searchPlaceholder: string;
        sortLabel: string;
        sortBy: string;
        sortToggle: string;
        sortNewest: string;
        sortOldest: string;
        sortByNewest: string;
        sortByOldest: string;
        colUser: string;
        colProjects: string;
        colStatus: string;
        colLastAction: string;
        colActions: string;
        statusActive: string;
        statusInactive: string;
        projectsCount_one: string;
        projectsCount_other: string;
        projectsLabel_one: string;
        projectsLabel_other: string;
        lastActionVerified: string;
        lastActionCreated: string;
        showingUsers: string;
        pageNumber: string;
        loading: string;
        emptyTitle: string;
        emptyBody: string;
        viewUser: string;
        editUser: string;
        activateUser: string;
        deactivateUser: string;
        activateSuccess: string;
        deactivateSuccess: string;
        statusActionError: string;
        deleteUser: string;
        deleteTitle: string;
        deleteBody: string;
        deleteCancel: string;
        deleteConfirm: string;
        deleteSuccess: string;
        deleteErrorFallback: string;
        createUser: string;
        previousPage: string;
        nextPage: string;
        updating: string;
        loadErrorTitle: string;
        loadErrorBody: string;
        accessDeniedTitle: string;
        accessDeniedBody: string;
      };
    };
    projects: {
      title: string;
      subtitle: string;
      emptyTitle: string;
      emptyBody: string;
      emailNotVerifiedTitle: string;
      emailNotVerifiedBody: string;
      verifyEmailTooltip: string;
      verifyEmailCta: string;
      listTitle: string;
      createProjectTitle: string;
      pendingLimitTitle: string;
      pendingLimitBody: string;
      statusFilter: {
        ariaLabel: string;
        all: string;
        active: string;
        pending: string;
        inactive: string;
        rejected: string;
        emptyTitle: string;
        emptyBody: string;
      };
      viewMode: {
        ariaLabel: string;
        cards: string;
        table: string;
      };
      cardActions: {
        approve: string;
        decline: string;
        active: string;
        inactive: string;
        pending: string;
        viewDetails: string;
        editProject: string;
        inviteUsers: string;
        deleteProject: string;
        moreActions: string;
        errorFallback: string;
        success: {
          approve: string;
          decline: string;
          active: string;
          inactive: string;
        };
      };
      seoGoals: {
        grow_brand_awareness: string;
        outrank_competitors: string;
        get_more_calls: string;
        increase_online_orders: string;
        improve_local_visibility: string;
      };
      seoGoalDescriptions: {
        grow_brand_awareness: string;
        outrank_competitors: string;
        get_more_calls: string;
        increase_online_orders: string;
        improve_local_visibility: string;
      };
      seoGoalTooltips: {
        grow_brand_awareness: string;
        outrank_competitors: string;
        get_more_calls: string;
        increase_online_orders: string;
        improve_local_visibility: string;
      };
      listCard: {
        projectOwnerLabel: string;
        projectOwnerFallback: string;
      };
      listIntegrations: {
        ariaLabel: string;
        tooltip: string;
        short: {
          gsc: string;
          ga4: string;
          wordpress: string;
        };
      };
      editProjectTitle: string;
      detail: {
        backToProjects: string;
        pageLead: string;
        editProject: string;
        loading: string;
        notFoundTitle: string;
        notFoundBody: string;
        forbiddenTitle: string;
        forbiddenBody: string;
        loadErrorTitle: string;
        loadErrorBody: string;
        website: string;
        contactNumber: string;
        contactEmail: string;
        address: string;
        sectionBusinessTitle: string;
        sectionBusinessLead: string;
        sectionServicesTitle: string;
        sectionServicesLead: string;
        sectionSeoGoalsTitle: string;
        sectionSeoGoalsLead: string;
        sectionIcpTitle: string;
        sectionIcpLead: string;
        sectionLocationsTitle: string;
        sectionLocationsLead: string;
        sectionCompetitorsTitle: string;
        sectionCompetitorsLead: string;
        sidebarMembersTitle: string;
        memberOwnerBadge: string;
        memberUserBadge: string;
        memberOwnerFallback: string;
        noMembers: string;
        timelineTitle: string;
        timelineCreated: string;
        timelineApproved: string;
        timelineRejected: string;
        timelineUpdated: string;
        noValue: string;
        noServices: string;
        noLocations: string;
        noSeoGoals: string;
        noCompetitors: string;
      };
      invitations: {
        bannerAria: string;
        title: string;
        invitedBy: string;
        unknownInviter: string;
        accept: string;
        decline: string;
        acceptSuccess: string;
        acceptError: string;
        declineSuccess: string;
        declineError: string;
      };
      createLead: string;
      createForm: {
        title: string;
        lead: string;
        editTitle: string;
        editLead: string;
        sectionBusinessLead: string;
        sectionSeoLead: string;
        sectionGoogleTitle: string;
        sectionGoogleLead: string;
        sectionCmsTitle: string;
        sectionCmsLead: string;
        businessName: string;
        businessNamePh: string;
        ownerUserId: string;
        ownerUserPlaceholder: string;
        ownerUserLoadError: string;
        ownerUserEmpty: string;
        websiteUrl: string;
        websiteUrlPh: string;
        businessAddress: string;
        businessAddressPh: string;
        companyLogoHint: string;
        companyLogoUploadLabel: string;
        pocContactNumber: string;
        pocContactNumberPh: string;
        pocEmail: string;
        pocEmailPh: string;
        sectionServiceLead: string;
        servicesOffered: string;
        servicesOfferedPh: string;
        servicesOfferedHelp: string;
        primaryServiceToPromote: string;
        primaryServiceToPromotePh: string;
        primaryServiceEmpty: string;
        idealCustomerProfile: string;
        idealCustomerProfilePh: string;
        sectionOperationsLead: string;
        sectionMarketingTitle: string;
        sectionMarketingLead: string;
        websiteLogin: string;
        websiteLoginPh: string;
        websiteHosting: string;
        websiteHostingPh: string;
        googleAnalytics: string;
        googleAnalyticsPh: string;
        googleSearchConsole: string;
        googleSearchConsolePh: string;
        googleBusinessProfile: string;
        googleBusinessProfilePh: string;
        websiteLoginShared: string;
        websiteLoginSharedDesc: string;
        websiteHostingShared: string;
        websiteHostingSharedDesc: string;
        googleAnalyticsShared: string;
        googleAnalyticsSharedDesc: string;
        googleSearchConsoleShared: string;
        googleSearchConsoleSharedDesc: string;
        googleBusinessProfileShared: string;
        googleBusinessProfileSharedDesc: string;
        sectionCompetitorsLead: string;
        competitorUrls: string;
        competitorUrlsPh: string;
        competitorUrlsHelp: string;
        industryNiche: string;
        industryNichePh: string;
        industryNicheLoading: string;
        industryNicheLoadError: string;
        targetLocations: string;
        targetLocationsPh: string;
        targetLocationsHelp: string;
        isB2b: string;
        isB2bDesc: string;
        isB2c: string;
        isB2cDesc: string;
        briefDescription: string;
        briefDescriptionPh: string;
        briefDescriptionHelp: string;
        seoGoals: string;
        seoGoalsHelp: string;
        seoGoalsLoading: string;
        seoGoalsLoadError: string;
        seoGoalsEmpty: string;
        hasGoogleAnalytics: string;
        hasGoogleAnalyticsDesc: string;
        hasGoogleSearchConsole: string;
        hasGoogleSearchConsoleDesc: string;
        hasGoogleTagManager: string;
        hasGoogleTagManagerDesc: string;
        hasGoogleAds: string;
        hasGoogleAdsDesc: string;
        googleConnect: string;
        googleConnectError: string;
        hasWebsiteLoginDetails: string;
        hasWebsiteLoginDetailsDesc: string;
        cmsLoginPageUrl: string;
        cmsLoginPageUrlPh: string;
        cmsUsername: string;
        cmsUsernamePh: string;
        cmsPassword: string;
        cmsPasswordPh: string;
        cmsPasswordEditPh: string;
        cmsPasswordEditHelp: string;
        submit: string;
        submitting: string;
        editSubmit: string;
        editSubmitting: string;
        successTitle: string;
        successFallback: string;
        editSuccessTitle: string;
        editSuccessFallback: string;
        errorTitle: string;
        errorFallback: string;
        editErrorTitle: string;
        editErrorFallback: string;
        missingProjectAccess: string;
        nextStep: string;
        previousStep: string;
        stepBasicInformation: string;
        stepServiceInformation: string;
        stepSeo: string;
        stepInviteUsers: string;
        sectionInviteUsersTitle: string;
        sectionInviteUsersLead: string;
        inviteSearchLabel: string;
        inviteSearchPlaceholder: string;
        inviteSearchEmpty: string;
        inviteSearchError: string;
        inviteSelectedLabel: string;
        inviteRemoveAria: string;
        inviteHelp: string;
        inviteHelpCreate: string;
        inviteHelpEdit: string;
        inviteLoading: string;
        inviteForbidden: string;
        inviteSuccess: string;
        inviteError: string;
        inviteRemoved: string;
        inviteRemoveError: string;
        inviteBatchSuccess: string;
        inviteBatchPartialError: string;
        stepValidationError: string;
        valRequired: string;
        valMin: string;
        valMax: string;
        valUrl: string;
        valTargetLocations: string;
        valSeoGoals: string;
        backToList: string;
        backToProject: string;
        editForbiddenTitle: string;
        editForbiddenBody: string;
        editNotAllowedTitle: string;
        editNotAllowedBody: string;
        remove: string;
      };
      inviteModal: {
        title: string;
        lead: string;
        leadWithProject: string;
        close: string;
        done: string;
        save: string;
        saving: string;
        loading: string;
        loadError: string;
        help: string;
        forbidden: string;
        inviteRemoved: string;
        inviteRemoveError: string;
        inviteError: string;
        inviteBatchSuccess: string;
        inviteBatchPartialError: string;
      };
      table: {
        toolbarHint: string;
        colId: string;
        colBusinessName: string;
        colWebsite: string;
        colStatus: string;
        colIntegrations: string;
        colBusinessType: string;
        colActions: string;
        createProject: string;
        noBusinessType: string;
        businessTypeB2b: string;
        businessTypeB2c: string;
        rowsSelected: string;
        rowsPerPage: string;
        pageOf: string;
        firstPage: string;
        previousPage: string;
        nextPage: string;
        lastPage: string;
        updating: string;
        loadErrorTitle: string;
        loadErrorBody: string;
        edit: string;
        delete: string;
        more: string;
        moreView: string;
        deleteConfirmTitle: string;
        deleteConfirmDescription: string;
        deleteConfirmCancel: string;
        deleteConfirmAction: string;
        deleteInProgress: string;
        deleteSuccessTitle: string;
        deleteSuccessFallback: string;
        deleteErrorTitle: string;
        dismiss: string;
        detailSheetLead: string;
        accessDeniedTitle: string;
        accessDeniedBody: string;
        yes: string;
        no: string;
        colIsB2b: string;
        colIsB2c: string;
        colIndustryNiche: string;
        colIndustryOther: string;
        colTargetLocations: string;
        colBriefDescription: string;
        colMainCompetitors: string;
        colSeoGoals: string;
        colSeoGoalOther: string;
        colGoogleAnalytics: string;
        colGoogleSearchConsole: string;
        colGoogleTagManager: string;
        colGoogleAds: string;
        colWebsiteLoginDetails: string;
        colCmsLoginUrl: string;
        colCmsUsername: string;
        colCmsPasswordSet: string;
        colCreatedAt: string;
        colUpdatedAt: string;
      };
    };
    analytics: {
      title: string;
      subtitle: string;
      selectProjectTitle: string;
      selectProjectBody: string;
      noAccessTitle: string;
      noAccessBody: string;
      loadError: string;
      dateFrom: string;
      dateTo: string;
      export: {
        excel: string;
        exporting: string;
        success: string;
        empty: string;
        errorFallback: string;
        metric: string;
        value: string;
        date: string;
        channel: string;
        country: string;
        sheets: {
          summary: string;
          dailyTrend: string;
          topQueries: string;
          topPages: string;
          trafficSources: string;
          countries: string;
        };
      };
      dateFilter: {
        ariaLabel: string;
        presetsHeading: string;
        presets: {
          last_15_days: string;
          last_30_days: string;
          last_90_days: string;
          last_month: string;
          this_month: string;
        };
        months: string[];
        weekdays: { sun: string; mon: string; tue: string; wed: string; thu: string; fri: string; sat: string };
        separator: string;
        fromPlaceholder: string;
        toPlaceholder: string;
        reset: string;
        cancel: string;
        apply: string;
        previousMonth: string;
        nextMonth: string;
      };
      summary: {
        clicks: string;
        impressions: string;
        ctr: string;
        position: string;
        sessions: string;
        organicSessions: string;
      };
      topQueries: {
        title: string;
        viewAll: string;
        loading: string;
        emptyTitle: string;
        emptyBody: string;
        modalTitle: string;
        modalSubtitle: string;
        modalClose: string;
        modalRowCount: string;
        columns: {
          dimension: string;
          clicks: string;
          impressions: string;
          ctr: string;
          position: string;
        };
      };
      topPages: {
        title: string;
        viewAll: string;
        loading: string;
        emptyTitle: string;
        emptyBody: string;
        modalTitle: string;
        modalSubtitle: string;
        modalClose: string;
        modalRowCount: string;
        columns: {
          dimension: string;
          clicks: string;
          impressions: string;
          ctr: string;
          position: string;
        };
      };
      engagementPreview: {
        engagementRate: {
          label: string;
          hint: string;
        };
        avgSessionDuration: {
          label: string;
          hint: string;
        };
        pageViews: {
          label: string;
          hint: string;
        };
      };
      trafficSources: {
        title: string;
        totalLabel: string;
        legendAria: string;
        loading: string;
        emptyTitle: string;
        emptyBody: string;
      };
      demographics: {
        title: string;
        subtitle: string;
        metricHint: string;
        listAria: string;
        mapAria: string;
        mapUnavailable: string;
        loading: string;
        emptyTitle: string;
        emptyBody: string;
      };
      trendChart: {
        title: string;
        subtitle: string;
        tabsAria: string;
        tabs: {
          clicks: string;
          impressions: string;
          ctr: string;
          position: string;
        };
        changeIncrease: string;
        changeDecrease: string;
        changeFlat: string;
        emptyTitle: string;
        emptyBody: string;
      };
      tables: {
        topQueries: string;
        topPages: string;
        geoTraffic: string;
        dimension: string;
        clicks: string;
        impressions: string;
        ctr: string;
        position: string;
        sessions: string;
        users: string;
        loading: string;
        emptyTitle: string;
        emptyBody: string;
      };
    };
    seoActivities: {
      title: string;
      subtitle: string;
      typeFilter: {
        ariaLabel: string;
        blogs: string;
        backlinks: string;
        technical_work: string;
      };
      summary: {
        cards: {
          blogs: string;
          backlinks: string;
          technical_work: string;
          total: string;
        };
      };
      dateFilter: {
        ariaLabel: string;
        presetsHeading: string;
        presets: {
          all: string;
          last_15_days: string;
          last_30_days: string;
          last_month: string;
          this_month: string;
          last_year: string;
          this_year: string;
        };
        months: [
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
        ];
        weekdays: {
          sun: string;
          mon: string;
          tue: string;
          wed: string;
          thu: string;
          fri: string;
          sat: string;
        };
        fromPlaceholder: string;
        toPlaceholder: string;
        separator: string;
        previousMonth: string;
        nextMonth: string;
        reset: string;
        cancel: string;
        apply: string;
      };
      table: {
        emptyTitle: string;
        emptyBody: string;
        summary: string;
        previousPage: string;
        nextPage: string;
        pageNumber: string;
        colDate: string;
        colBlogDetails: string;
        colBacklinkDetails: string;
        colChangeDetails: string;
        colBlogLink: string;
        colUrls: string;
        colPageLink: string;
        colActions: string;
        editActivity: string;
        deleteActivity: string;
        deleteTitle: string;
        deleteBody: string;
        deleteCancel: string;
        deleteConfirm: string;
        deleteSuccess: string;
        deleteErrorFallback: string;
        loadErrorBody: string;
      };
      selectProjectTitle: string;
      selectProjectBody: string;
      export: {
        excel: string;
        success: string;
        empty: string;
        errorFallback: string;
      };
      quickAdd: {
        trigger: string;
        title: string;
        lead: string;
        editTitle: string;
        editLead: string;
        close: string;
        tabsAriaLabel: string;
        tabs: {
          blogs: string;
          backlinks: string;
          technical_work: string;
        };
        fields: {
          title: string;
          titlePh: string;
          anchorText: string;
          anchorTextPh: string;
          details: string;
          detailsPh: string;
          url: string;
          urlPh: string;
          occurredOn: string;
        };
        validation: {
          required: string;
          url: string;
          date: string;
          minTitle: string;
          maxTitle: string;
          minAnchor: string;
          minDetails: string;
        };
        cancel: string;
        submit: string;
        save: string;
        success: {
          blogs: string;
          backlinks: string;
          technical_work: string;
        };
        updateSuccess: {
          blogs: string;
          backlinks: string;
          technical_work: string;
        };
        createErrorFallback: string;
        updateErrorFallback: string;
      };
    };
    leads: {
      title: string;
      subtitle: string;
      selectProjectTitle: string;
      selectProjectBody: string;
      summary: {
        total: string;
        thisMonth: string;
        lastMonth: string;
        thisYear: string;
      };
      table: {
        emptyTitle: string;
        emptyBody: string;
        summary: string;
        previousPage: string;
        nextPage: string;
        pageNumber: string;
        colDate: string;
        colName: string;
        colFirstName: string;
        colLastName: string;
        colEmail: string;
        colPhone: string;
        colServices: string;
        colMessage: string;
        colSource: string;
        colActions: string;
        viewLead: string;
        editLead: string;
        deleteLead: string;
        deleteTitle: string;
        deleteBody: string;
        deleteCancel: string;
        deleteConfirm: string;
        deleteSuccess: string;
        deleteErrorFallback: string;
        loadErrorBody: string;
      };
      source: {
        wordpress: string;
        others: string;
      };
      detail: {
        title: string;
        lead: string;
        unnamed: string;
        leadTitle: string;
        leadSectionLead: string;
        leadDate: string;
        source: string;
        services: string;
        message: string;
        extrasTitle: string;
        extrasLead: string;
      };
      importExport: {
        trigger: string;
        import: string;
        export: string;
        exportSuccess: string;
        exportEmpty: string;
        exportErrorFallback: string;
      };
      editor: {
        trigger: string;
        createTitle: string;
        createLead: string;
        editTitle: string;
        editLead: string;
        close: string;
        cancel: string;
        submit: string;
        save: string;
        createSuccess: string;
        updateSuccess: string;
        createErrorFallback: string;
        updateErrorFallback: string;
        inactiveProject: string;
        extrasTitle: string;
        extrasHint: string;
        fields: {
          firstName: string;
          firstNamePh: string;
          lastName: string;
          lastNamePh: string;
          email: string;
          emailPh: string;
          phone: string;
          phonePh: string;
          leadDate: string;
          services: string;
          servicesPh: string;
          message: string;
          messagePh: string;
        };
        validation: {
          required: string;
          email: string;
          phone: string;
          date: string;
          maxName: string;
          maxServices: string;
          maxMessage: string;
        };
      };
      importModal: {
        titleImport: string;
        titleMatching: string;
        close: string;
        cancel: string;
        chooseFile: string;
        chooseFileHint: string;
        downloadSample: string;
        downloadSampleHint: string;
        downloadSampleError: string;
        removeFile: string;
        nextMatching: string;
        nextImport: string;
        matchBanner: string;
        rowCount: string;
        selectColumn: string;
        doNotImport: string;
        useToday: string;
        parsing: string;
        parsingHint: string;
        importing: string;
        importingHint: string;
        importSuccess: string;
        importSuccessWithSkips: string;
        importNone: string;
        inactiveProject: string;
        extrasTitle: string;
        extrasHint: string;
        keepAsExtra: string;
        fields: {
          firstName: string;
          lastName: string;
          email: string;
          phone: string;
          message: string;
          servicesInterestedIn: string;
          leadDate: string;
        };
        errors: {
          csvOnly: string;
          tooLarge: string;
          parseFallback: string;
          importFallback: string;
        };
      };
    };
    roles: {
      title: string;
      subtitle: string;
      createRoleTitle: string;
      editRoleTitle: string;
      createForm: {
        title: string;
        lead: string;
        editTitle: string;
        editLead: string;
        editSubmit: string;
        editSubmitting: string;
        editSuccessTitle: string;
        editSuccessFallback: string;
        editErrorTitle: string;
        editErrorFallback: string;
        name: string;
        namePh: string;
        description: string;
        descriptionPh: string;
        systemRoleNameLocked: string;
        permsHeading: string;
        permsLead: string;
        permsModulesHeading: string;
        permsModuleLead: string;
        permsSelectAll: string;
        permsClearAll: string;
        permsCount: string;
        permsLoading: string;
        permsEmpty: string;
        permsLoadErrorTitle: string;
        permsLoadErrorBody: string;
        submit: string;
        submitting: string;
        successTitle: string;
        successFallback: string;
        errorTitle: string;
        errorFallback: string;
        valRequired: string;
        valMin: string;
        valMax: string;
        backToList: string;
      };
      actions: {
        view: string;
        create: string;
        edit: string;
        delete: string;
        invite: string;
        remove: string;
        disconnect: string;
        refresh: string;
        import: string;
        export: string;
      };
      detail: {
        title: string;
        lead: string;
        loading: string;
        overviewTitle: string;
        overviewLead: string;
        description: string;
        noDescription: string;
        members: string;
        permissionsCount: string;
        createdAt: string;
        updatedAt: string;
        permissionsTitle: string;
        permissionsLead: string;
        noPermissions: string;
      };
      statusFilter: {
        ariaLabel: string;
        all: string;
        active: string;
        inactive: string;
      };
      table: {
        searchPlaceholder: string;
        sortLabel: string;
        sortBy: string;
        sortToggle: string;
        sortNewest: string;
        sortOldest: string;
        sortByNewest: string;
        sortByOldest: string;
        colRole: string;
        colPermissions: string;
        colMembers: string;
        colSystem: string;
        colStatus: string;
        colActions: string;
        scopePlatform: string;
        scopeProject: string;
        permissionsCount: string;
        systemYes: string;
        systemNo: string;
        statusActive: string;
        statusInactive: string;
        showingRoles: string;
        pageNumber: string;
        loading: string;
        emptyTitle: string;
        emptyBody: string;
        viewRole: string;
        editRole: string;
        activateRole: string;
        deactivateRole: string;
        activateSuccess: string;
        deactivateSuccess: string;
        statusActionError: string;
        deleteRole: string;
        deleteTitle: string;
        deleteBody: string;
        deleteCancel: string;
        deleteConfirm: string;
        deleteSuccess: string;
        deleteErrorFallback: string;
        createRole: string;
        previousPage: string;
        nextPage: string;
        updating: string;
        loadErrorTitle: string;
        loadErrorBody: string;
        accessDeniedTitle: string;
        accessDeniedBody: string;
      };
    };
  };
  auth: {
    signIn: {
      title: string;
      subtitle: string;
      email: string;
      password: string;
      submit: string;
      forgotPassword: string;
      heroTitleStart: string;
      heroTitleAccent: string;
      heroLead: string;
      heroFeature1Title: string;
      heroFeature1Body: string;
      heroFeature2Title: string;
      heroFeature2Body: string;
      heroFeature3Title: string;
      heroFeature3Body: string;
      heroFeature4Title: string;
      heroFeature4Body: string;
      trustSecure: string;
      trustUptime: string;
      trustRoles: string;
      trustGoogle: string;
      continueWith: string;
      continueGoogle: string;
      continueSso: string;
      emailInvalid: string;
      fieldRequired: string;
      loginSuccess: string;
      loginErrorUnexpected: string;
      emailVerifiedSuccess: string;
      registrationSuccess: string;
      noAccountPrompt: string;
      registerCta: string;
      googleCallbackTitle: string;
      googleCallbackSubtitle: string;
      googleCallbackBody: string;
      googleExchangeMissing: string;
      googleExchangeFailed: string;
    };
    forgotPassword: {
      title: string;
      subtitle: string;
      email: string;
      submit: string;
      backToSignIn: string;
      emailInvalid: string;
      fieldRequired: string;
      submitSuccess: string;
      submitErrorFallback: string;
    };
    resetPassword: {
      title: string;
      subtitle: string;
      password: string;
      confirmPassword: string;
      submit: string;
      backToSignIn: string;
      fieldRequired: string;
      passwordMin: string;
      passwordMismatch: string;
      submitSuccess: string;
      submitErrorFallback: string;
      invalidLinkTitle: string;
      invalidLinkBody: string;
    };
    register: {
      title: string;
      subtitle: string;
      fullName: string;
      fullNamePh: string;
      fullNameMin: string;
      fullNameMax: string;
      email: string;
      password: string;
      confirmPassword: string;
      passwordMin: string;
      passwordMismatch: string;
      submit: string;
      hasAccount: string;
      signInLink: string;
      fieldRequired: string;
      emailInvalid: string;
      submitSuccess: string;
      submitErrorFallback: string;
    };
    verification: {
      title: string;
      description: string;
      resendCta: string;
      resendSuccess: string;
      resendErrorFallback: string;
    };
  };
  lang: {
    en: string;
    ar: string;
    aria: string;
    switchToArabic: string;
    switchToEnglish: string;
  };
  theme: {
    switchToLight: string;
    switchToDark: string;
  };
}

const translation: Translation = {
  layout: {
    appName: "Crawllex",
  },
  projectSelector: {
    triggerLabel: "Selected Project: {{name}}",
    listLabel: "Switch Project",
    listHeading: "Your Projects",
    cardLabel: "Project",
    emptyLabel: "No Projects Available",
    selectPrompt: "Select A Project To Continue",
  },
  nav: {
    aria: "Main Navigation",
    openMenu: "Open Menu",
    closeMenu: "Close Menu",
    collapseSidebar: "Collapse Sidebar",
    expandSidebar: "Expand Sidebar",
    groupGeneral: "General",
    groupReporting: "Reporting",
    groupSettings: "Settings",
    dashboard: "Dashboard",
    users: "Users",
    rolesPermissions: "Roles & Permissions",
    projects: "Projects",
    analytics: "Analytics",
    seoActivities: "SEO Activities",
    leads: "Leads",
    settings: "Settings",
  },
  breadcrumb: {
    root: "Dashboard",
    new: "New",
    edit: "Edit",
  },
  table: {
    emptyTitle: "No Records Found",
    emptyBody: "There Is Nothing To Show Here Yet. Create A New Entry Or Check Back Later.",
    loading: "Loading…",
  },
  ui: {
    close: "Close",
    error: {
      title: "Something Went Wrong",
      description:
        "Our Team Has Been Notified About This Error And We Are Fixing It.",
      tryAgain: "Try Again",
      goHome: "Go To Home",
    },
  },
  form: {
    showPassword: "Show password",
    hidePassword: "Hide password",
    pickImage: "Upload Image",
    changeImage: "Change Image",
    fileTooLarge: "File exceeds {{max}} MB.",
    searchCountry: "Search Country…",
    noCountriesFound: "No Countries Found.",
    removeChip: "Remove {{value}}",
  },
  userMenu: {
    openMenu: "Account menu",
    menuLabel: "Account actions",
    settings: "Settings",
    editProfile: "Edit profile",
    changePassword: "Change password",
    logOut: "Log out",
    fallbackName: "User",
    noEmail: "No email on file",
    emailVerified: "Your Email is Verified",
    emailNotVerified: "Your Email is not Verified",
    resendVerification: "Tap to resend verification email",
  },
  settings: {
    title: "Settings",
    subtitle: "Manage workspace preferences.",
    emptyTitle: "No Settings Available",
    emptyBody: "There are no settings modules available for your account yet.",
    categoriesHeading: "Categories",
    categories: {
      theme: "Theme",
      integrations: "Integrations",
    },
    themePacks: {
      sectionTitle: "Color Theme",
      lead: "Choose a color theme. Your selection syncs to your account.",
      selected: "Selected",
      saveErrorFallback: "Could not save theme.",
      default: "Default",
      defaultDescription: "Orange and purple brand palette for everyday use.",
      "glass-aurora": "Glass Aurora",
      "glass-auroraDescription":
        "Premium glassmorphism theme with soft aurora accents for a futuristic SaaS experience.",
      "verdant-grove": "Verdant Grove",
      "verdant-groveDescription":
        "Soft stone surfaces with emerald growth accents for clean premium SEO clarity.",
      "lumen-slate": "Lumen Slate",
      "lumen-slateDescription":
        "Clean slate surfaces with indigo clarity for a premium agency workspace.",
    },
    fontPacks: {
      sectionTitle: "Font",
      lead: "Choose a typeface for the dashboard. Your selection syncs to your account.",
      selected: "Selected",
      saveErrorFallback: "Could not save font.",
      jakarta: "Plus Jakarta Sans",
      jakartaDescription: "Default modern sans — clear and friendly for everyday dashboard use.",
      ubuntu: "Ubuntu",
      ubuntuDescription: "Humanist sans with warm character for a distinctive product voice.",
      nunito: "Nunito",
      nunitoDescription: "Rounded soft sans for a friendly, approachable interface feel.",
      inter: "Inter",
      interDescription: "Modern UI sans optimized for dense screens and long reading.",
    },
    integrations: {
      lead: "Link Search Console, GA4, and WordPress lead capture for the selected project.",
      projectContext: "Selected Project: {{name}}",
      selectProjectTitle: "Select A Project",
      selectProjectBody: "Choose a project from the sidebar before linking integrations.",
      refresh: "Refresh Data",
      connect: "Connect",
      update: "Update",
      disconnect: "Disconnect",
      propertyLabel: "Property",
      propertyPlaceholder: "Select A Property",
      propertyRequired: "Property ID is required.",
      gscPropertyPlaceholder: "https://example.com/",
      ga4PropertyPlaceholder: "properties/123456789",
      lastSynced: "Last synced {{value}}",
      connectSuccess: "Integration connected.",
      connectError: "Could not connect.",
      updateSuccess: "Integration updated.",
      updateError: "Could not update.",
      disconnectSuccess: "Integration disconnected.",
      disconnectError: "Could not disconnect.",
      syncSuccess: "Analytics synced.",
      syncError: "Could not sync.",
      refreshSuccess: "Analytics synced.",
      refreshError: "Could not sync.",
      confirmCancel: "Cancel",
      confirmConnectTitle: "Connect Property?",
      confirmConnectBody: "Link This {{service}} Property To The Selected Project And Start Syncing Cached Analytics.",
      confirmConnect: "Connect Property",
      confirmUpdateTitle: "Update Property?",
      confirmUpdateBody: "Replace The Linked {{service}} Property For This Project. Cached Analytics For The Previous Property Will Be Cleared And A Fresh Backfill Will Start.",
      confirmUpdate: "Update Property",
      confirmDisconnectTitle: "Disconnect Property?",
      confirmDisconnectBody: "Remove The {{service}} Link For This Project And Clear Cached Analytics For That Source.",
      confirmDisconnect: "Disconnect",
      confirmRefreshTitle: "Refresh Analytics Data?",
      confirmRefreshBody: "Pull The Latest Search Console And GA4 Metrics For This Project. Manual Refresh Is Limited To Once Per Hour.",
      confirmRefresh: "Refresh Data",
      analyticsTitle: "Analytics",
      analyticsLead: "Connect Search Console and GA4 for cached search and traffic metrics.",
      leadsTitle: "Leads",
      leadsLead: "Connect WordPress lead capture for the selected project.",
      services: {
        gsc: "Search Console",
        ga4: "Google Analytics 4",
        wordpress: "WordPress",
      },
      serviceLead: {
        gsc: "Connect the Search Console property used for organic search performance.",
        ga4: "Connect the GA4 property used for sessions and traffic breakdowns.",
      },
      status: {
        connected: "Connected",
        disconnected: "Disconnected",
        error: "Error",
      },
      wordpress: {
        title: "WordPress",
        lead: "Download the WordPress plugin and connect a lead source key. The key stays hidden until you view or copy it.",
        connect: "Connect",
        viewKey: "View Key",
        viewKeyError: "Could not load the lead source key.",
        disconnect: "Disconnect",
        downloadPlugin: "Download Plugin",
        downloadError: "The plugin could not be downloaded.",
        siteUrlPending: "Website URL will appear after the plugin tests the connection.",
        connectedAt: "Connected {{value}}",
        lastVerified: "Last Verified {{value}}",
        ingestStats: "Ingested {{ingested}} · Failed {{failed}}",
        inactiveProject: "WordPress can only be connected when the project is active.",
        loadError: "Could not load the WordPress lead source.",
        connectSuccess: "Lead source connected. Copy the key into the WordPress plugin.",
        connectError: "Could not connect WordPress.",
        disconnectSuccess: "WordPress disconnected.",
        disconnectError: "Could not disconnect WordPress.",
        confirmConnectTitle: "Connect WordPress?",
        confirmConnectBody:
          "Create a lead source key for this project. Paste it in the WordPress plugin. You can view it again from this card.",
        confirmConnect: "Connect WordPress",
        confirmDisconnectTitle: "Disconnect WordPress?",
        confirmDisconnectBody:
          "The WordPress plugin will no longer be able to send leads to this project.",
        confirmDisconnect: "Disconnect",
        keyDialogTitle: "Lead Source Key",
        keyDialogLead: "Copy this key and paste it in the WordPress plugin. You can view it again from Integrations.",
        keyLabel: "Lead Source Key",
        copyKey: "Copy Key",
        keyCopied: "Key copied.",
        copyError: "Could not copy the key.",
        done: "Done",
      },
    },
  },
  profile: {
    changePassword: {
      title: "Change Password",
      lead: "Update Your Password. Use A Strong, Unique Password You Don't Reuse Elsewhere.",
      currentPassword: "Current Password",
      currentPasswordPh: "Enter Your Current Password",
      newPassword: "New Password",
      newPasswordPh: "At Least 8 Characters",
      confirmPassword: "Confirm New Password",
      confirmPasswordPh: "Re-Enter Your New Password",
      submit: "Update Password",
      submitting: "Updating…",
      successTitle: "Password Updated",
      successFallback: "Password changed.",
      errorTitle: "Could Not Update Password",
      errorFallback: "Something went wrong.",
      valRequired: "This Field Is Required.",
      valMin: "Use At Least 8 Characters.",
      valMatch: "Passwords Do Not Match.",
      cancel: "Cancel",
    },
    edit: {
      breadcrumbTitle: "Edit Profile",
      title: "Your Profile",
      lead: "Update Your Display Name And Photo. Email Cannot Be Changed Here.",
      loading: "Loading Profile…",
      loadErrorTitle: "Could Not Load Profile",
      loadErrorBody: "Could not load data.",
      saving: "Saving…",
      save: "Save Changes",
      successTitle: "Profile Updated",
      successFallback: "Changes saved.",
      errorTitle: "Could Not Save Profile",
      errorFallback: "Something went wrong.",
      nameLabel: "Display Name",
      namePh: "Your Name",
      valRequired: "This Field Is Required.",
      valMin: "Use At Least 2 Characters.",
      valMax: "Use At Most 50 Characters.",
      photoLabel: "Profile Photo",
      photoHint: "JPG, PNG, WEBP, Or GIF. Max 5 MB.",
      photoPick: "Upload Photo",
      photoChange: "Change Photo",
      photoClear: "Remove New Photo",
      noChanges: "No changes to save.",
      sectionReadonly: "Account details",
      emailLabel: "Email",
      rolesHeading: "Roles",
      permissionsHeading: "Permissions",
      noRoles: "No roles assigned.",
      noPermissions: "No permissions on this account.",
      linkChangePassword: "Change password",
    },
  },
  home: {
    title: "Dashboard",
    subtitle: "Project pulse, search trends, and quick answers for the selected date range.",
    selectProjectTitle: "Select A Project",
    selectProjectBody: "Choose a project from the sidebar to open its control center.",
    loadError: "Could not load dashboard data. Try again.",
    dateFilterAriaLabel: "Dashboard Date Range",
    export: {
      excel: "Export Excel",
      success: "Excel report downloaded.",
      empty: "No dashboard data for this range.",
      errorFallback: "Could not export dashboard data.",
      metric: "Metric",
      value: "Value",
      date: "Date",
      sessions: "Sessions",
      sheets: {
        summary: "Summary",
        dailyTrend: "Daily Trend",
      },
    },
    pulse: {
      title: "SEO Pulse",
      cards: {
        leads: "Leads",
        backlinks: "Backlinks Created",
        pageViews: "Page Views",
        blogs: "Blogs Published",
      },
      descriptions: {
        leads: "You got {{count}} leads.",
        backlinks: "You gained {{count}} backlinks.",
        pageViews: "You recorded {{count}} page views.",
        blogs: "You published {{count}} blogs.",
        unavailable: "Not available for your access on this project.",
      },
    },
    trend: {
      title: "SEO Performance Trend",
      subtitle:
        "Clicks, impressions, CTR, position, engagement rate, and session time for the selected range.",
      gridAria: "Search performance metrics",
      emptyTitle: "No Trend Data",
      emptyBody: "Connect Search Console and Analytics, then sync to populate these metrics.",
      noSeries: "No series yet.",
      cards: {
        clicks: "Clicks",
        impressions: "Impressions",
        ctr: "CTR",
        position: "Position",
        engagementRate: "Engagement Rate",
        avgSessionDuration: "Session Time",
      },
      descriptions: {
        clicks: "You got {{count}} clicks from search.",
        impressions: "You got {{count}} impressions in search results.",
        ctr: "Your click-through rate is {{count}}.",
        position: "Your average position is {{count}}.",
        engagementRate: "Your engagement rate is {{count}}.",
        avgSessionDuration: "Visitors spend {{count}} per session on average.",
        unavailable: "Not available for this project yet.",
      },
      direction: {
        up: "Trending up over this range.",
        down: "Trending down over this range.",
        flat: "Holding steady over this range.",
      },
    },
    assistant: {
      title: "Dashboard Assistant",
      greeting: "Hi {{name}}",
      greetingFallback: "Hi There",
      description:
        "I'm your Dashboard Assistant. Ask about leads, analytics, or SEO activities for this project. Answers use cached project data only.",
      descriptionShort:
        "I'm your Dashboard Assistant. Ask about leads, analytics, or SEO activities for this project.",
      placeholder: "Ask about leads, analytics, or SEO activities…",
      inputLabel: "Assistant Query",
      submit: "Ask",
      asking: "Asking…",
      suggestionsLabel: "Try Asking",
      popularTitle: "Popular Questions",
      historyLabel: "Recent Queries",
      historyLoading: "Loading recent queries…",
      answerLabel: "Answer",
      emptyAnswer: "Pick a suggestion or type a question to see a quick project summary.",
      queryError: "Could not run that query. Try again.",
      tipTitle: "Pro Tip",
      tipBody: "Ask about leads, analytics, pages, queries, or SEO activities for this project.",
      suggestions: {
        leadsThisMonth: "Leads This Month",
        leadsLastMonth: "Leads Last Month",
        leadsThisYear: "Leads This Year",
        analyticsOverview: "Analytics Overview",
        topQueries: "Top Queries",
        topPages: "Top Pages",
        blogs: "Blogs Published",
        backlinks: "Backlinks Created",
        technicalWork: "Technical Work",
      },
    },
  },
  modules: {
    users: {
      title: "Users",
      subtitle: "Manage Users And Their Access In Your Workspace.",
      createUserTitle: "Create User",
      createLead:
        "Add A New User Account With Name, Email, And Password. Assign Project Roles When Inviting Them To A Project.",
      editUserTitle: "Edit User",
      editLead: "Update This User's Name, Email, Password, Or Profile Image.",
      createForm: {
        profileImage: "Profile Image",
        profileImageHint: "JPEG, PNG, WebP, Or GIF. Optional.",
        profileImageUploadLabel: "Upload User Image",
        profileImageChangeLabel: "Change User Image",
        name: "Full Name",
        namePh: "Enter Full Name",
        email: "Email Address",
        emailPh: "Enter Email Address",
        password: "Password",
        passwordPh: "At Least 8 Characters",
        passwordPhEdit: "Leave Blank To Keep Current Password",
        passwordConfirmation: "Confirm Password",
        passwordConfirmationPh: "Re-Enter Password",
        passwordConfirmationPhEdit: "Re-Enter New Password",
        submit: "Create User",
        submitting: "Creating…",
        editSubmit: "Save Changes",
        editSubmitting: "Saving…",
        backToList: "Back To Users",
        valRequired: "This Field Is Required.",
        valEmail: "Enter A Valid Email Address.",
        valMinPassword: "Use At Least 8 Characters.",
        valPasswordMatch: "Passwords Do Not Match.",
        valMax: "Use At Most 50 Characters.",
        successFallback: "User created.",
        errorFallback: "Could not create user.",
        editSuccessFallback: "User updated.",
        editErrorFallback: "Could not update user.",
        membershipAssignError: "User created. Assignment failed.",
      },
      memberships: {
        title: "Project Assignments",
        lead: "Assign This User To Projects With A Project Role. Role Changes On Edit Save Immediately.",
        count: "{{count}} Assigned",
        empty: "No projects assigned yet.",
        projectLabel: "Project",
        projectPh: "Select Project",
        roleLabel: "Role",
        rolePh: "Select Role",
        add: "Add",
        addTitle: "Add Project Assignment",
        addLead: "Choose A Project And Role For This User.",
        save: "Save",
        saving: "Saving",
        removeAria: "Remove {{name}}",
        statusInvited: "Invite Pending",
        assignSuccess: "Project assignment saved.",
        assignError: "Could not save assignment.",
        updateSuccess: "Project role updated.",
        updateError: "Could not update role.",
        removeSuccess: "Project assignment removed.",
        removeError: "Could not remove assignment.",
        confirmUpdateTitle: "Update Project Role?",
        confirmUpdateBody: "Change The Role On {{name}} To {{role}}.",
        confirmUpdate: "Update Role",
        confirmRemoveTitle: "Remove Project Assignment?",
        confirmRemoveBody: "Remove This User From {{name}}. They Will Lose Project Access.",
        confirmRemove: "Remove Assignment",
        confirmCancel: "Cancel",
      },
      assignments: {
        noProjects: "No Projects Assigned",
        membershipOwner: "Project Owner",
        membershipMember: "Project User",
        membershipInvited: "Invite Pending",
        projectStatus: {
          pending: "Pending",
          active: "Active",
          inactive: "Inactive",
          rejected: "Rejected",
        },
      },
      detail: {
        title: "User Details",
        lead: "Account information and project memberships from the current list.",
        accountTitle: "Account Information",
        accountLead: "Core profile fields for this user.",
        email: "Email",
        accountSource: "Account Source",
        accountSourceUnknown: "Unknown",
        createdAt: "Created",
        updatedAt: "Last Updated",
        emailVerifiedAt: "Email Verified",
        emailNotVerified: "Not Verified",
        projectsTitle: "Assigned Projects",
        projectsLead: "Projects this user owns or belongs to.",
      },
      accountSource: {
        admin: "Admin Created",
        self_register: "Self Registered",
        google: "Google",
      },
      accountSourceFilter: {
        ariaLabel: "Filter Users By Account Source",
        label: "Source",
        all: "All Sources",
      },
      statusFilter: {
        ariaLabel: "Filter Users By Status",
        all: "All Users",
        active: "Active",
        inactive: "Inactive",
      },
      table: {
        searchPlaceholder: "Search Users...",
        sortLabel: "Sort",
        sortBy: "Sort By",
        sortToggle: "Sort By {{direction}}",
        sortNewest: "Newest",
        sortOldest: "Oldest",
        sortByNewest: "Newest",
        sortByOldest: "Oldest",
        colUser: "User",
        colProjects: "Projects",
        colStatus: "Status",
        colLastAction: "Last Action",
        colActions: "Actions",
        statusActive: "Active",
        statusInactive: "Inactive",
        projectsCount_one: "{{count}} Project",
        projectsCount_other: "{{count}} Projects",
        projectsLabel_one: "Project",
        projectsLabel_other: "Projects",
        lastActionVerified: "Email Verified",
        lastActionCreated: "Account Created",
        showingUsers: "Showing {{from}} To {{to}} Of {{total}} Users",
        pageNumber: "Page {{page}}",
        loading: "Loading Users...",
        emptyTitle: "No Users Found",
        emptyBody: "Try Another Search Or Clear Filters To View All Users.",
        viewUser: "View {{name}}",
        editUser: "Edit {{name}}",
        activateUser: "Activate {{name}}",
        deactivateUser: "Deactivate {{name}}",
        activateSuccess: "User activated.",
        deactivateSuccess: "User deactivated.",
        statusActionError: "Could not update status.",
        deleteUser: "Delete {{name}}",
        deleteTitle: "Delete User?",
        deleteBody: "This User Will Be Permanently Removed.\nThis Action Cannot Be Undone.",
        deleteCancel: "Cancel",
        deleteConfirm: "Delete",
        deleteSuccess: "User deleted.",
        deleteErrorFallback: "Could not delete user.",
        createUser: "Add User",
        previousPage: "Previous Page",
        nextPage: "Next Page",
        updating: "Updating…",
        loadErrorTitle: "Could Not Load Users",
        loadErrorBody: "Could not load data.",
        accessDeniedTitle: "No Access",
        accessDeniedBody: "You don't have permission to view users.",
      },
    },
    projects: {
      title: "Projects",
      subtitle: "Manage SEO projects in your workspace.",
      emptyTitle: "No Projects Found",
      emptyBody: "Create Your First Project To Complete Onboarding Or Ask An Admin To Assign You To A Project.",
      emailNotVerifiedTitle: "Email Not Verified",
      emailNotVerifiedBody: "Verify Your Email Before Creating A Project.",
      verifyEmailTooltip: "Verify Your Email Before Creating A Project.",
      verifyEmailCta: "Verify Email",
      listTitle: "Projects",
      createProjectTitle: "Create A New Project",
      pendingLimitTitle: "Project Awaiting Approval",
      pendingLimitBody:
        "You already have a project pending approval. Wait for a decision before creating another.",
      statusFilter: {
        ariaLabel: "Filter Projects By Status",
        all: "All Projects",
        active: "Active",
        pending: "Pending Approval",
        inactive: "Inactive",
        rejected: "Rejected",
        emptyTitle: "No Projects Match This Filter",
        emptyBody: "Try Another Status Or View All Projects.",
      },
      viewMode: {
        ariaLabel: "Projects Layout",
        cards: "Cards View",
        table: "Table View",
      },
      cardActions: {
        approve: "Approve",
        decline: "Decline",
        active: "Activate",
        inactive: "Deactivate",
        pending: "Pending",
        viewDetails: "View Details",
        editProject: "Edit Project",
        inviteUsers: "Invite Users",
        deleteProject: "Delete Project",
        moreActions: "More Actions",
        errorFallback: "Could not update status.",
        success: {
          approve: "Project approved.",
          decline: "Project rejected.",
          active: "Project activated.",
          inactive: "Project deactivated.",
        },
      },
      seoGoals: {
        grow_brand_awareness: "Increase Brand Visibility",
        outrank_competitors: "Outperform Competitors",
        get_more_calls: "Generate More Leads",
        increase_online_orders: "Increase Online Sales",
        improve_local_visibility: "Strengthen Local Presence",
      },
      seoGoalDescriptions: {
        grow_brand_awareness: "Build Awareness And Improve Your Presence In Organic Search Results.",
        outrank_competitors: "Track Competitors, Identify Opportunities, And Gain A Competitive Edge.",
        get_more_calls: "Drive Qualified Enquiries, Calls, And Contact Form Submissions.",
        increase_online_orders: "Improve Organic Traffic That Converts Into Purchases And Revenue.",
        improve_local_visibility: "Improve Visibility In Local Search Results, Google Maps, And Nearby Searches.",
      },
      seoGoalTooltips: {
        grow_brand_awareness: "Grow Your Online Presence And Improve Brand Recognition Through Organic Search.",
        outrank_competitors: "Monitor Competitors' Rankings, Keywords, And Backlink Strategies.",
        get_more_calls: "Optimise Your Website To Attract Qualified Enquiries And Conversions.",
        increase_online_orders: "Improve Product Visibility And Drive More Revenue From Organic Traffic.",
        improve_local_visibility: "Boost Visibility In Local Search Results And Google Business Profile.",
      },
      listCard: {
        projectOwnerLabel: "Project Owner",
        projectOwnerFallback: "Project Owner",
      },
      listIntegrations: {
        ariaLabel: "Project Integrations",
        tooltip: "{{service}}: {{status}}",
        short: {
          gsc: "GSC",
          ga4: "GA4",
          wordpress: "WP",
        },
      },
      editProjectTitle: "Edit Project",
      detail: {
        backToProjects: "Back To Projects",
        pageLead: "Manage All Information, Integrations, And SEO Settings For This Project.",
        editProject: "Edit Project",
        loading: "Loading Project…",
        notFoundTitle: "Project Not Found",
        notFoundBody: "This project may have been removed, rejected, or you do not have access.",
        forbiddenTitle: "Access Denied",
        forbiddenBody: "You do not have permission to view this project.",
        loadErrorTitle: "Could Not Load Project",
        loadErrorBody: "Could not load data.",
        website: "Website",
        contactNumber: "Contact Number",
        contactEmail: "Contact Email",
        address: "Address",
        sectionBusinessTitle: "Business Information",
        sectionBusinessLead: "Core Business Details Collected During Onboarding.",
        sectionServicesTitle: "Services Offered",
        sectionServicesLead: "Services The Business Provides To Clients.",
        sectionSeoGoalsTitle: "SEO Goals",
        sectionSeoGoalsLead: "Select The Outcomes This Project Should Drive. Pick All That Apply.",
        sectionIcpTitle: "Ideal Customer Profile",
        sectionIcpLead: "Who The Business Wants To Reach.",
        sectionLocationsTitle: "Target Locations",
        sectionLocationsLead: "Geographic Areas This Project Focuses On.",
        sectionCompetitorsTitle: "Competitors",
        sectionCompetitorsLead: "Competitor Names Or Websites Provided For Benchmarking.",
        sidebarMembersTitle: "Project Members",
        memberOwnerBadge: "Project Owner",
        memberUserBadge: "Project User",
        memberOwnerFallback: "Project Owner",
        noMembers: "No Members",
        timelineTitle: "Timeline",
        timelineCreated: "Created",
        timelineApproved: "Approved",
        timelineRejected: "Rejected",
        timelineUpdated: "Last Updated",
        noValue: "Not Provided",
        noServices: "No Services Listed.",
        noLocations: "No Target Locations Listed.",
        noSeoGoals: "No SEO Goals Selected.",
        noCompetitors: "No Competitors Listed.",
      },
      invitations: {
        bannerAria: "Pending Project Invitations",
        title: "Invitation To {{projectName}}",
        invitedBy: "Invited By {{name}}",
        unknownInviter: "A Project Owner",
        accept: "Accept",
        decline: "Decline",
        acceptSuccess: "Invitation accepted.",
        acceptError: "Could not accept invitation.",
        declineSuccess: "Invitation declined.",
        declineError: "Could not decline invitation.",
      },
      createLead:
        "Set Up Your Business Profile To Start Tracking Your Website's SEO Performance, Rankings, And Growth Opportunities.",
      createForm: {
        title: "Project Details",
        lead: "Fill In The Business Basics, SEO Goals, And Access Information For This Project.",
        editTitle: "Edit Project",
        editLead: "Update The Project's Business Details, SEO Goals, And Access Information.",
        sectionBusinessLead:
          "Tell Us About Your Business So We Can Personalise Your Crawllex Workspace And Generate Accurate Insights.",
        sectionSeoLead:
          "Configure Your SEO Goals And Competitors To Personalise Your Dashboard, Reporting, And Optimisation Strategy.",
        sectionGoogleTitle: "Google Tools",
        sectionGoogleLead: "Which Google Products Are Connected For This Site?",
        sectionCmsTitle: "CMS Access",
        sectionCmsLead: "Optional Login Details So We Can Deploy SEO Changes.",
        businessName: "Business Name",
        businessNamePh: "E.g. Example Ltd",
        ownerUserId: "Project Owner",
        ownerUserPlaceholder: "Select A Project Owner",
        ownerUserLoadError: "Could not load users.",
        ownerUserEmpty: "No Verified Users Available To Assign.",
        websiteUrl: "Website URL",
        websiteUrlPh: "example.com",
        businessAddress: "Business Address",
        businessAddressPh: "Street Address, City, State/Province, Country",
        companyLogoHint: "Upload Your Brand Logo. JPG, PNG, WEBP, Or GIF (Maximum 5 MB).",
        companyLogoUploadLabel: "Upload Company Logo",
        pocContactNumber: "Contact Number",
        pocContactNumberPh: "5X XXX XXXX",
        pocEmail: "Business Email",
        pocEmailPh: "contact@example.com",
        sectionServiceLead:
          "Define Your Business Offerings And Target Audience To Receive Personalised SEO Recommendations And Market Insights.",
        servicesOffered: "Services / Products Offered",
        servicesOfferedPh: "E.g. SEO, Web Design, PPC Advertising, Content Marketing",
        servicesOfferedHelp: "Press Enter Or Comma To Add. Backspace Removes The Last Tag.",
        primaryServiceToPromote: "Primary Service / Product",
        primaryServiceToPromotePh: "Select A Primary Service / Product",
        primaryServiceEmpty: "Add Services Above First",
        idealCustomerProfile: "Ideal Customer",
        idealCustomerProfilePh: "E.g. Small And Medium-Sized Businesses Looking To Grow Their Online Presence",
        sectionOperationsLead:
          "Tell Us Where Your Business Operates So We Can Personalise Local Search Tracking And Location-Based SEO.",
        sectionMarketingTitle: "Marketing Access",
        sectionMarketingLead: "Mark Which Channel Access Has Been Shared.",
        websiteLogin: "Website Login",
        websiteLoginPh: "https://portal.saudiamarketing.sa",
        websiteHosting: "Website Hosting",
        websiteHostingPh: "AWS Riyadh Region Account",
        googleAnalytics: "Google Analytics",
        googleAnalyticsPh: "https://analytics.google.com/",
        googleSearchConsole: "Google Search Console",
        googleSearchConsolePh: "https://search.google.com/search-console",
        googleBusinessProfile: "Google Business Profile",
        googleBusinessProfilePh: "https://business.google.com/",
        websiteLoginShared: "Website Login Shared",
        websiteLoginSharedDesc: "The Client Has Shared Website Login Access.",
        websiteHostingShared: "Website Hosting Shared",
        websiteHostingSharedDesc: "The Client Has Shared Website Hosting Access.",
        googleAnalyticsShared: "Google Analytics Shared",
        googleAnalyticsSharedDesc: "The Client Has Shared Google Analytics Access.",
        googleSearchConsoleShared: "Google Search Console Shared",
        googleSearchConsoleSharedDesc: "The Client Has Shared Google Search Console Access.",
        googleBusinessProfileShared: "Google Business Profile Shared",
        googleBusinessProfileSharedDesc: "The Client Has Shared Google Business Profile Access.",
        sectionCompetitorsLead:
          "Add The Names Or Websites Of Your Main Competitors So We Can Benchmark Your SEO Performance And Uncover Opportunities.",
        competitorUrls: "Competitor Names Or URLs",
        competitorUrlsPh: "Enter Your Competitor Names Or URLs: https://competitor1.com, Competitor 2, https://competitor3.com",
        competitorUrlsHelp: "Press Enter Or Comma To Add. Backspace Removes The Last Tag.",
        industryNiche: "Industry Niche",
        industryNichePh: "Select An Industry",
        industryNicheLoading: "Loading Industries…",
        industryNicheLoadError: "Could not load industries.",
        targetLocations: "Target Locations",
        targetLocationsPh: "E.g. Riyadh, Jeddah, Dammam, Saudi Arabia",
        targetLocationsHelp: "Press Enter Or Comma To Add. Backspace Removes The Last Tag.",
        isB2b: "B2B",
        isB2bDesc: "Sells to other businesses.",
        isB2c: "B2C",
        isB2cDesc: "Sells directly to consumers.",
        briefDescription: "Brief description",
        briefDescriptionPh: "A short summary of the business and what it offers.",
        briefDescriptionHelp: "Optional — a couple of sentences is enough.",
        seoGoals: "Select SEO goals",
        seoGoalsHelp: "Pick all that apply.",
        seoGoalsLoading: "Loading SEO goals…",
        seoGoalsLoadError: "Could not load SEO goals. Try again later.",
        seoGoalsEmpty: "No SEO goals available.",
        hasGoogleAnalytics: "Google Analytics",
        hasGoogleAnalyticsDesc: "GA4 property is configured.",
        hasGoogleSearchConsole: "Google Search Console",
        hasGoogleSearchConsoleDesc: "Search Console property is verified.",
        hasGoogleTagManager: "Google Tag Manager",
        hasGoogleTagManagerDesc: "GTM container is installed.",
        hasGoogleAds: "Google Ads",
        hasGoogleAdsDesc: "Google Ads account is active.",
        googleConnect: "Connect",
        googleConnectError: "Could not connect. Try again.",
        hasWebsiteLoginDetails: "Website login details available",
        hasWebsiteLoginDetailsDesc: "We have credentials to log into the CMS.",
        cmsLoginPageUrl: "CMS login URL",
        cmsLoginPageUrlPh: "https://acme.example.com/wp-login.php",
        cmsUsername: "CMS username",
        cmsUsernamePh: "admin",
        cmsPassword: "CMS password",
        cmsPasswordPh: "••••••••",
        cmsPasswordEditPh: "Leave blank to keep current",
        cmsPasswordEditHelp: "Only enter a value if you want to change the saved password.",
        submit: "Create Project",
        submitting: "Creating…",
        editSubmit: "Save Changes",
        editSubmitting: "Saving…",
        successTitle: "Project Saved",
        successFallback: "Project created.",
        editSuccessTitle: "Project Updated",
        editSuccessFallback: "Project updated.",
        errorTitle: "Could Not Create Project",
        errorFallback: "Something went wrong.",
        editErrorTitle: "Could Not Update Project",
        editErrorFallback: "Something went wrong.",
        missingProjectAccess:
          "You are not a member of any project yet. Complete onboarding or ask a project owner to invite you.",
        nextStep: "Next Step",
        previousStep: "Back",
        stepBasicInformation: "Business Information",
        stepServiceInformation: "Business Details",
        stepSeo: "SEO Configuration",
        stepInviteUsers: "Invite Users",
        sectionInviteUsersTitle: "Invite Users",
        sectionInviteUsersLead:
          "Search Registered Users By Name Or Email And Invite Them As Project Users. They Must Accept Before Gaining Access.",
        inviteSearchLabel: "Search Users",
        inviteSearchPlaceholder: "Search By Name Or Email…",
        inviteSearchEmpty: "No Matching Users Found.",
        inviteSearchError: "Could not search users.",
        inviteSelectedLabel: "Selected Invitees",
        inviteRemoveAria: "Remove {{name}}",
        inviteHelp: "Only Registered, Verified Users Can Be Invited.",
        inviteHelpCreate:
          "Only Registered, Verified Users Can Be Invited. Invitations Are Sent After The Project Is Created.",
        inviteHelpEdit: "Only Registered, Verified Users Can Be Invited. Invitations Are Sent Immediately.",
        inviteLoading: "Loading Invited Users…",
        inviteForbidden: "You do not have permission to invite users.",
        inviteSuccess: "Invitation sent.",
        inviteError: "Could not send invitation.",
        inviteRemoved: "Invitation removed.",
        inviteRemoveError: "Could not remove invitation.",
        inviteBatchSuccess: "Invitations sent.",
        inviteBatchPartialError: "{{count}} invitations failed.",
        stepValidationError: "Fix required fields.",
        valRequired: "This Field Is Required.",
        valMin: "Use At Least 2 Characters.",
        valMax: "Use At Most 50 Characters.",
        valUrl: "Enter A Valid Website URL (E.G. Example.Com).",
        valTargetLocations: "Add At Least One Location.",
        valSeoGoals: "Select At Least One SEO Objective.",
        backToList: "Back To Projects",
        backToProject: "Back To Project",
        editForbiddenTitle: "You Cannot Edit This Project",
        editForbiddenBody: "You Do Not Have Permission To Edit This Project.",
        editNotAllowedTitle: "Project Cannot Be Edited",
        editNotAllowedBody: "Rejected Projects Cannot Be Updated.",
        remove: "Remove",
      },
      inviteModal: {
        title: "Invite Users",
        lead: "Search Platform Users And Invite Them To This Project.",
        leadWithProject: "Invite Users To {{name}}.",
        close: "Close",
        done: "Done",
        save: "Send Invites",
        saving: "Sending…",
        loading: "Loading Project Members…",
        loadError: "Could not load project members.",
        help: "Only Registered, Verified Users Can Be Invited. Invitations Are Sent When You Save.",
        forbidden: "You do not have permission to invite users.",
        inviteRemoved: "Invitation removed.",
        inviteRemoveError: "Could not remove invitation.",
        inviteError: "Could not send invitations.",
        inviteBatchSuccess: "Invitations sent.",
        inviteBatchPartialError: "{{count}} invitations failed.",
      },
      table: {
        toolbarHint: "Projects in your workspace.",
        colId: "ID",
        colBusinessName: "Business Name",
        colWebsite: "Website",
        colStatus: "Status",
        colIntegrations: "Integrations",
        colBusinessType: "Business type",
        colActions: "Actions",
        createProject: "Create Project",
        noBusinessType: "No business type",
        businessTypeB2b: "B2B",
        businessTypeB2c: "B2C",
        rowsSelected: "{{selected}} of {{total}} row(s) selected",
        rowsPerPage: "Rows per page",
        pageOf: "Page {{page}} of {{count}}",
        firstPage: "First page",
        previousPage: "Previous page",
        nextPage: "Next page",
        lastPage: "Last page",
        updating: "Refreshing…",
        loadErrorTitle: "Could not load projects",
        loadErrorBody: "Check your connection and try again.",
        edit: "Edit",
        delete: "Delete",
        more: "More actions",
        moreView: "View details",
        deleteConfirmTitle: "Delete This Project?",
        deleteConfirmDescription: "This Will Remove “{{name}}”.\nThis Action Cannot Be Undone.",
        deleteConfirmCancel: "Cancel",
        deleteConfirmAction: "Delete Project",
        deleteInProgress: "Deleting…",
        deleteSuccessTitle: "Project Deleted",
        deleteSuccessFallback: "Project deleted.",
        deleteErrorTitle: "Could Not Delete Project",
        dismiss: "Dismiss",
        detailSheetLead: "Full project details from the current page.",
        accessDeniedTitle: "No Access",
        accessDeniedBody: "You don't have permission to view projects.",
        yes: "Yes",
        no: "No",
        colIsB2b: "B2B",
        colIsB2c: "B2C",
        colIndustryNiche: "Industry niche",
        colIndustryOther: "Industry (other)",
        colTargetLocations: "Target locations",
        colBriefDescription: "Brief description",
        colMainCompetitors: "Main competitors",
        colSeoGoals: "SEO goals",
        colSeoGoalOther: "SEO goal (other)",
        colGoogleAnalytics: "Google Analytics",
        colGoogleSearchConsole: "Google Search Console",
        colGoogleTagManager: "Google Tag Manager",
        colGoogleAds: "Google Ads",
        colWebsiteLoginDetails: "Website login details",
        colCmsLoginUrl: "CMS login URL",
        colCmsUsername: "CMS username",
        colCmsPasswordSet: "CMS password set",
        colCreatedAt: "Created",
        colUpdatedAt: "Updated",
      },
    },
    analytics: {
      title: "Analytics",
      subtitle: "Search Console And Analytics Performance For The Selected Project.",
      selectProjectTitle: "Select A Project",
      selectProjectBody: "Choose A Project From The Sidebar To View Analytics.",
      noAccessTitle: "Analytics Access Required",
      noAccessBody: "You Do Not Have Permission To View Analytics For This Project.",
      loadError: "Failed to load analytics.",
      dateFrom: "From",
      dateTo: "To",
      export: {
        excel: "Export Excel",
        exporting: "Exporting…",
        success: "Excel report downloaded.",
        empty: "No analytics data.",
        errorFallback: "Could not export analytics.",
        metric: "Metric",
        value: "Value",
        date: "Date",
        channel: "Channel",
        country: "Country",
        sheets: {
          summary: "Summary",
          dailyTrend: "Daily Trend",
          topQueries: "Top Queries",
          topPages: "Top Pages",
          trafficSources: "Traffic Sources",
          countries: "Countries",
        },
      },
      dateFilter: {
        ariaLabel: "Analytics Date Range",
        presetsHeading: "Quick Ranges",
        presets: {
          last_15_days: "Last 15 Days",
          last_30_days: "Last 30 Days",
          this_month: "This Month",
          last_month: "Last Month",
          last_90_days: "Last 90 Days",
        },
        months: [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December",
        ],
        weekdays: { sun: "Su", mon: "Mo", tue: "Tu", wed: "We", thu: "Th", fri: "Fr", sat: "Sa" },
        separator: "—",
        fromPlaceholder: "Start",
        toPlaceholder: "End",
        reset: "Reset",
        cancel: "Cancel",
        apply: "Apply",
        previousMonth: "Previous Month",
        nextMonth: "Next Month",
      },
      summary: {
        clicks: "Total Clicks",
        impressions: "Impressions",
        ctr: "Avg. CTR",
        position: "Avg. Position",
        sessions: "Sessions",
        organicSessions: "Organic Sessions",
      },
      topQueries: {
        title: "Top Search Queries",
        viewAll: "View All Queries",
        loading: "Loading…",
        emptyTitle: "No Search Queries",
        emptyBody: "Connect Search Console And Sync To Populate This Table.",
        modalTitle: "All Top Search Queries",
        modalSubtitle: "Full Ranking List For The Selected Date Range.",
        modalClose: "Close",
        modalRowCount: "{{count}} Queries",
        columns: {
          dimension: "Query",
          clicks: "Clicks",
          impressions: "Impressions",
          ctr: "CTR",
          position: "Position",
        },
      },
      topPages: {
        title: "Top Pages",
        viewAll: "View All Pages",
        loading: "Loading…",
        emptyTitle: "No Pages",
        emptyBody: "Connect Search Console And Sync To Populate This Table.",
        modalTitle: "All Top Pages",
        modalSubtitle: "Full Ranking List For The Selected Date Range.",
        modalClose: "Close",
        modalRowCount: "{{count}} Pages",
        columns: {
          dimension: "Page",
          clicks: "Clicks",
          impressions: "Impressions",
          ctr: "CTR",
          position: "Position",
        },
      },
      engagementPreview: {
        engagementRate: {
          label: "Engagement Rate",
          hint: "Share of sessions that qualify as engaged.",
        },
        avgSessionDuration: {
          label: "Avg. Session Duration",
          hint: "Average time visitors spend per session.",
        },
        pageViews: {
          label: "Page Views",
          hint: "Total content views in the selected range.",
        },
      },
      trafficSources: {
        title: "Traffic Sources",
        totalLabel: "Total",
        legendAria: "Traffic Source Breakdown",
        loading: "Loading…",
        emptyTitle: "No Traffic Sources",
        emptyBody: "Connect Google Analytics And Sync To Populate This Chart.",
      },
      demographics: {
        title: "User Demographics",
        subtitle: "Where users engage by territory.",
        metricHint: "Total users in the selected date range.",
        listAria: "Top Countries By Users",
        mapAria: "World Map Of Users By Country",
        mapUnavailable: "Map Unavailable",
        loading: "Loading…",
        emptyTitle: "No Geographic Data",
        emptyBody: "Connect Google Analytics and sync to populate this map.",
      },
      trendChart: {
        title: "SEO Performance Trend",
        subtitle: "Comparing Search Clicks And Organic Impressions Over Time.",
        tabsAria: "Performance Metric",
        tabs: {
          clicks: "Clicks",
          impressions: "Impressions",
          ctr: "CTR",
          position: "Position",
        },
        changeIncrease: "Increase",
        changeDecrease: "Decrease",
        changeFlat: "No Change",
        emptyTitle: "No Trend Data",
        emptyBody: "Connect Search Console And Sync To Populate This Chart.",
      },
      tables: {
        topQueries: "Top Queries",
        topPages: "Top Pages",
        geoTraffic: "Geographic Traffic",
        dimension: "Dimension",
        clicks: "Clicks",
        impressions: "Impressions",
        ctr: "CTR",
        position: "Position",
        sessions: "Sessions",
        users: "Users",
        loading: "Loading…",
        emptyTitle: "No Analytics Rows",
        emptyBody: "Connect Integrations And Sync To Populate This Table.",
      },
    },
    seoActivities: {
      title: "SEO Activities",
      subtitle: "Track blogs, backlinks, and technical work for the selected project.",
      typeFilter: {
        ariaLabel: "SEO Activity Type",
        blogs: "Blogs",
        backlinks: "Backlinks",
        technical_work: "Technical Work",
      },
      summary: {
        cards: {
          blogs: "Blogs Published",
          backlinks: "Backlinks Gained",
          technical_work: "Technical Work Issues Fixed",
          total: "All Activities Total",
        },
      },
      dateFilter: {
        ariaLabel: "Date Range Filter",
        presetsHeading: "Quick Ranges",
        presets: {
          all: "All Time",
          last_15_days: "Last 15 Days",
          last_30_days: "Last 30 Days",
          last_month: "Last Month",
          this_month: "This Month",
          last_year: "Last Year",
          this_year: "This Year",
        },
        months: [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ],
        weekdays: {
          sun: "S",
          mon: "M",
          tue: "T",
          wed: "W",
          thu: "T",
          fri: "F",
          sat: "S",
        },
        fromPlaceholder: "From",
        toPlaceholder: "To",
        separator: "–",
        previousMonth: "Previous Month",
        nextMonth: "Next Month",
        reset: "Reset",
        cancel: "Cancel",
        apply: "Apply",
      },
      table: {
        emptyTitle: "No Activities Found",
        emptyBody: "There Are No Rows For This Activity Type Yet.",
        summary: "Showing {{shown}} Of {{total}} Monitored Changes",
        previousPage: "Previous Page",
        nextPage: "Next Page",
        pageNumber: "Page {{page}}",
        colDate: "Date",
        colBlogDetails: "Blog Details",
        colBacklinkDetails: "Backlink Details",
        colChangeDetails: "Work Details",
        colBlogLink: "Blog Link",
        colUrls: "Links",
        colPageLink: "Page Link",
        colActions: "Actions",
        editActivity: "Edit Activity",
        deleteActivity: "Delete Activity",
        deleteTitle: "Delete Activity?",
        deleteBody: "This Activity Will Be Removed From The Selected Project.",
        deleteCancel: "Cancel",
        deleteConfirm: "Delete",
        deleteSuccess: "Activity deleted.",
        deleteErrorFallback: "Could not delete activity.",
        loadErrorBody: "Could not load activities.",
      },
      selectProjectTitle: "Select A Project",
      selectProjectBody: "Choose A Project From The Sidebar To Manage Its SEO Activities.",
      export: {
        excel: "Export Excel",
        success: "Excel report downloaded.",
        empty: "No matching activities.",
        errorFallback: "Could not export activities.",
      },
      quickAdd: {
        trigger: "Add Activity",
        title: "Quick Add",
        lead: "Capture A New SEO Activity In A Few Seconds.",
        editTitle: "Edit Activity",
        editLead: "Update The Fields Below, Then Save Your Changes.",
        close: "Close",
        tabsAriaLabel: "Activity Type",
        tabs: {
          blogs: "Blogs",
          backlinks: "Backlinks",
          technical_work: "Technical Work",
        },
        fields: {
          title: "Blog Title",
          titlePh: "How To Improve Local SEO Rankings",
          anchorText: "Anchor Text",
          anchorTextPh: "Best SEO Agency",
          details: "Work Details",
          detailsPh: "Updated Meta Description On Services Page",
          url: "Link",
          urlPh: "https://example.com/page",
          occurredOn: "Date",
        },
        validation: {
          required: "This Field Is Required.",
          url: "Enter A Valid Http Or Https Link.",
          date: "Enter A Valid Date.",
          minTitle: "Use At Least 3 Characters.",
          maxTitle: "Use At Most 50 Characters.",
          minAnchor: "Use At Least 2 Characters.",
          minDetails: "Use At Least 4 Characters.",
        },
        cancel: "Cancel",
        submit: "Add Activity",
        save: "Save Changes",
        success: {
          blogs: "Blog Activity Added.",
          backlinks: "Backlink Activity Added.",
          technical_work: "Technical Work Activity Added.",
        },
        updateSuccess: {
          blogs: "Blog Activity Updated.",
          backlinks: "Backlink Activity Updated.",
          technical_work: "Technical Work Activity Updated.",
        },
        createErrorFallback: "Could not create activity.",
        updateErrorFallback: "Could not update activity.",
      },
    },
    leads: {
      title: "Leads",
      subtitle: "Review and manage project leads from imports, manual entry, and WordPress.",
      selectProjectTitle: "Select A Project",
      selectProjectBody: "Choose a project from the sidebar to manage its leads.",
      summary: {
        total: "Total Leads",
        thisMonth: "This Month",
        lastMonth: "Last Month",
        thisYear: "This Year",
      },
      table: {
        emptyTitle: "No Leads Found",
        emptyBody: "Import a CSV, add a lead, or capture from WordPress.",
        summary: "Showing {{shown}} Of {{total}} Leads",
        previousPage: "Previous Page",
        nextPage: "Next Page",
        pageNumber: "Page {{page}}",
        colDate: "Date",
        colName: "Name",
        colFirstName: "First Name",
        colLastName: "Last Name",
        colEmail: "Email",
        colPhone: "Phone Number",
        colServices: "Services Interested In",
        colMessage: "Message",
        colSource: "Source",
        colActions: "Actions",
        viewLead: "View Lead",
        editLead: "Edit Lead",
        deleteLead: "Delete Lead",
        deleteTitle: "Delete Lead?",
        deleteBody: "This lead will be removed from the selected project.",
        deleteCancel: "Cancel",
        deleteConfirm: "Delete",
        deleteSuccess: "Lead deleted.",
        deleteErrorFallback: "Could not delete lead.",
        loadErrorBody: "Could not load leads.",
      },
      source: {
        wordpress: "WordPress Integration",
        others: "Others",
      },
      detail: {
        title: "Lead Details",
        lead: "Contact details, source, message, and any extra fields from import or WordPress.",
        unnamed: "Lead",
        leadTitle: "Lead Details",
        leadSectionLead: "Date, source, and the original message.",
        leadDate: "Date",
        source: "Source",
        services: "Services Interested In",
        message: "Message",
        extrasTitle: "Additional Fields",
        extrasLead: "Extra columns kept from the source form or CSV.",
      },
      importExport: {
        trigger: "Import / Export",
        import: "Import",
        export: "Export",
        exportSuccess: "Excel report downloaded.",
        exportEmpty: "No matching leads.",
        exportErrorFallback: "Could not export leads.",
      },
      editor: {
        trigger: "Add Lead",
        createTitle: "Add Lead",
        createLead: "Enter the lead details below.",
        editTitle: "Edit Lead",
        editLead: "Update the fields below, then save your changes.",
        close: "Close",
        cancel: "Cancel",
        submit: "Add Lead",
        save: "Save Changes",
        createSuccess: "Lead created.",
        updateSuccess: "Lead updated.",
        createErrorFallback: "Could not create lead.",
        updateErrorFallback: "Could not update lead.",
        inactiveProject: "Leads can only be added when the project is active.",
        extrasTitle: "Additional Fields",
        extrasHint: "Imported with this lead. Not editable here.",
        fields: {
          firstName: "First Name",
          firstNamePh: "Jane",
          lastName: "Last Name",
          lastNamePh: "Doe",
          email: "Email",
          emailPh: "jane@example.com",
          phone: "Phone Number",
          phonePh: "+1 555 0100",
          leadDate: "Date",
          services: "Services Interested In",
          servicesPh: "Local SEO, content…",
          message: "Message",
          messagePh: "Looking for a quote…",
        },
        validation: {
          required: "This field is required.",
          email: "Enter a valid email.",
          phone: "Enter a valid phone number.",
          date: "Enter a valid date.",
          maxName: "Use at most 80 characters.",
          maxServices: "Use at most 500 characters.",
          maxMessage: "Use at most 5000 characters.",
        },
      },
      importModal: {
        titleImport: "Import",
        titleMatching: "Matching",
        close: "Close",
        cancel: "Cancel",
        chooseFile: "Choose CSV File",
        chooseFileHint: "Upload a .CSV export from Sheets or Excel.",
        downloadSample: "Download Sample CSV",
        downloadSampleHint: "Use this sheet to see the expected columns.",
        downloadSampleError: "The sample CSV could not be downloaded.",
        removeFile: "Remove File",
        nextMatching: "Matching",
        nextImport: "Import",
        matchBanner: "Match Lead Fields To Uploaded File",
        rowCount: "{{count}} rows found.",
        selectColumn: "Select Column",
        doNotImport: "Do Not Import",
        useToday: "Use Today's Date",
        parsing: "Parsing CSV…",
        parsingHint: "Reading headers and preparing field matching.",
        importing: "Importing Leads…",
        importingHint: "Saving matched rows to this project.",
        importSuccess: "Imported {{imported}} leads.",
        importSuccessWithSkips:
          "Imported {{imported}} leads. Skipped {{skippedDuplicates}} duplicates and {{skippedInvalid}} invalid rows.",
        importNone: "No leads imported. Skipped {{skippedDuplicates}} duplicates and {{skippedInvalid}} invalid rows.",
        inactiveProject: "Leads can only be imported when the project is active.",
        extrasTitle: "Additional Columns",
        extrasHint: "Unmapped columns can be kept on the lead or skipped.",
        keepAsExtra: "Keep As Extra",
        fields: {
          firstName: "First Name",
          lastName: "Last Name",
          email: "Email",
          phone: "Phone Number",
          message: "Message",
          servicesInterestedIn: "Services Interested In",
          leadDate: "Date",
        },
        errors: {
          csvOnly: "Only CSV files are supported.",
          tooLarge: "CSV file is too large.",
          parseFallback: "Could not parse CSV.",
          importFallback: "Could not import leads.",
        },
      },
    },
    roles: {
      title: "Roles & Permissions",
      subtitle: "Manage role templates and their permission sets.",
      createRoleTitle: "Create Role",
      editRoleTitle: "Edit Role",
      createForm: {
        title: "Create Role",
        lead: "Give the role a name and select the permissions it should grant.",
        editTitle: "Edit Role",
        editLead: "Update the role name and permissions, then save your changes.",
        editSubmit: "Save Changes",
        editSubmitting: "Saving…",
        editSuccessTitle: "Role Updated",
        editSuccessFallback: "Role updated.",
        editErrorTitle: "Could Not Update Role",
        editErrorFallback: "Could not update role.",
        name: "Role Name",
        namePh: "Content Manager",
        description: "Description",
        descriptionPh: "What this role is for…",
        systemRoleNameLocked: "System role names can't be changed. You can still edit the description and permissions.",
        permsHeading: "Select Permissions",
        permsLead: "Choose which modules and actions this role can access.",
        permsModulesHeading: "Modules",
        permsModuleLead: "Toggle the actions available for this module.",
        permsSelectAll: "Select All",
        permsClearAll: "Clear All",
        permsCount: "{{selected}} Of {{total}} Selected",
        permsLoading: "Loading Permissions…",
        permsEmpty: "No permissions available.",
        permsLoadErrorTitle: "Could Not Load Permissions",
        permsLoadErrorBody: "Could not load data.",
        submit: "Create Role",
        submitting: "Creating…",
        successTitle: "Role Created",
        successFallback: "Role created.",
        errorTitle: "Could Not Create Role",
        errorFallback: "Could not create role.",
        valRequired: "This field is required.",
        valMin: "Use at least 2 characters.",
        valMax: "Use at most 50 characters.",
        backToList: "Back To Roles",
      },
      actions: {
        view: "View",
        create: "Create",
        edit: "Edit",
        delete: "Delete",
        invite: "Invite",
        remove: "Remove",
        disconnect: "Disconnect",
        refresh: "Refresh",
        import: "Import",
        export: "Export",
      },
      detail: {
        title: "Role Details",
        lead: "Permission summary for this role.",
        loading: "Loading Role…",
        overviewTitle: "Role Overview",
        overviewLead: "Membership and permission counts for this role.",
        description: "Description",
        noDescription: "No description provided.",
        members: "Members",
        permissionsCount: "Permissions",
        createdAt: "Created",
        updatedAt: "Last Updated",
        permissionsTitle: "Granted Permissions",
        permissionsLead: "Modules and actions this role can perform.",
        noPermissions: "No permissions granted.",
      },
      statusFilter: {
        ariaLabel: "Filter Roles By Status",
        all: "All Roles",
        active: "Active",
        inactive: "Inactive",
      },
      table: {
        searchPlaceholder: "Search Roles...",
        sortLabel: "Sort",
        sortBy: "Sort By",
        sortToggle: "Sort By {{direction}}",
        sortNewest: "Newest",
        sortOldest: "Oldest",
        sortByNewest: "Newest",
        sortByOldest: "Oldest",
        colRole: "Role",
        colPermissions: "Permissions",
        colMembers: "Members",
        colSystem: "System",
        colStatus: "Status",
        colActions: "Actions",
        scopePlatform: "Platform",
        scopeProject: "Project",
        permissionsCount: "{{count}} Permissions",
        systemYes: "System",
        systemNo: "Custom",
        statusActive: "Active",
        statusInactive: "Inactive",
        showingRoles: "Showing {{from}} To {{to}} Of {{total}} Roles",
        pageNumber: "Page {{page}}",
        loading: "Loading Roles...",
        emptyTitle: "No Roles Found",
        emptyBody: "Try Another Search Or Clear Filters To View All Roles.",
        viewRole: "View {{name}}",
        editRole: "Edit {{name}}",
        activateRole: "Activate {{name}}",
        deactivateRole: "Deactivate {{name}}",
        activateSuccess: "Role activated.",
        deactivateSuccess: "Role deactivated.",
        statusActionError: "Could not update status.",
        deleteRole: "Delete {{name}}",
        deleteTitle: "Delete Role?",
        deleteBody: "This Role Will Be Permanently Removed.\nThis Action Cannot Be Undone.",
        deleteCancel: "Cancel",
        deleteConfirm: "Delete",
        deleteSuccess: "Role deleted.",
        deleteErrorFallback: "Could not delete role.",
        createRole: "Add Role",
        previousPage: "Previous Page",
        nextPage: "Next Page",
        updating: "Updating…",
        loadErrorTitle: "Could Not Load Roles",
        loadErrorBody: "Could not load data.",
        accessDeniedTitle: "No Access",
        accessDeniedBody: "You don't have permission to view roles.",
      },
    },
  },
  auth: {
    signIn: {
      title: "Welcome Back",
      subtitle: "Sign in to your Crawllex workspace.",
      email: "Email",
      password: "Password",
      submit: "Log In",
      forgotPassword: "Forgot Password?",
      heroTitleStart: "SEO Operations For",
      heroTitleAccent: "Every Client",
      heroLead:
        "Run every client from one workspace — dashboard assistant, WordPress leads, search analytics, and SEO activity in the same place.",
      heroFeature1Title: "Dashboard Assistant",
      heroFeature1Body: "Ask in plain English and get answers from leads, analytics, and SEO activity.",
      heroFeature2Title: "WordPress Integration",
      heroFeature2Body: "Website forms land in Crawllex automatically with the official plugin.",
      heroFeature3Title: "Search Performance",
      heroFeature3Body: "Clicks, impressions, rankings, and engagement in one client-ready view.",
      heroFeature4Title: "Multi-Client Dashboards",
      heroFeature4Body: "Switch projects in a click and keep every client workspace separate.",
      trustSecure: "Secure Access",
      trustUptime: "Always On",
      trustRoles: "Team Roles",
      trustGoogle: "Google Sign-In",
      continueWith: "Or Continue With",
      continueGoogle: "Continue With Google",
      continueSso: "SSO",
      emailInvalid: "Enter a valid email address.",
      fieldRequired: "This field is required.",
      loginSuccess: "Signed in.",
      loginErrorUnexpected: "Something went wrong.",
      emailVerifiedSuccess: "Email verified. You can sign in.",
      registrationSuccess: "Account created. Check your email.",
      noAccountPrompt: "New Here?",
      registerCta: "Start Your Journey",
      googleCallbackTitle: "Signing You In",
      googleCallbackSubtitle: "Finishing Google sign-in.",
      googleCallbackBody: "One moment while we connect your account.",
      googleExchangeMissing: "Google sign-in was incomplete. Try again.",
      googleExchangeFailed: "Google sign-in failed. Try again.",
    },
    forgotPassword: {
      title: "Forgot Password",
      subtitle:
        "Enter your account email and we'll send reset instructions if the address is registered.",
      email: "Email",
      submit: "Send Reset Link",
      backToSignIn: "Back To Sign In",
      emailInvalid: "Enter a valid email address.",
      fieldRequired: "This field is required.",
      submitSuccess: "Reset link sent. Check your email.",
      submitErrorFallback: "Could not send reset link.",
    },
    resetPassword: {
      title: "Reset Password",
      subtitle: "Choose a new password for your account. This link can only be used once.",
      password: "New Password",
      confirmPassword: "Confirm Password",
      submit: "Reset Password",
      backToSignIn: "Back To Sign In",
      fieldRequired: "This field is required.",
      passwordMin: "Use at least 8 characters.",
      passwordMismatch: "Passwords do not match.",
      submitSuccess: "Password updated. You can sign in.",
      submitErrorFallback: "Could not reset password.",
      invalidLinkTitle: "Invalid Reset Link",
      invalidLinkBody:
        "This link is missing required information. Request a new reset email from the sign-in page.",
    },
    register: {
      title: "Create An Account",
      subtitle: "Create an account to get started with Crawllex.",
      fullName: "Full Name",
      fullNamePh: "Jane Doe",
      fullNameMin: "Enter at least 2 characters.",
      fullNameMax: "Use at most 50 characters.",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",
      passwordMin: "Use at least 8 characters.",
      passwordMismatch: "Passwords do not match.",
      submit: "Create Account",
      hasAccount: "Already Have An Account?",
      signInLink: "Log In",
      fieldRequired: "This field is required.",
      emailInvalid: "Enter a valid email address.",
      submitSuccess: "Account created. Check your email.",
      submitErrorFallback: "Could not complete registration.",
    },
    verification: {
      title: "Verify Your Email Address",
      description:
        "Before you continue, confirm your email using the link we sent. If you did not receive it, you can request another.",
      resendCta: "Resend Verification Email",
      resendSuccess: "Verification link sent.",
      resendErrorFallback: "Could not send verification email.",
    },
  },
  lang: {
    en: "English",
    ar: "العربية",
    aria: "Interface language",
    switchToArabic: "Switch interface to Arabic",
    switchToEnglish: "Switch interface to English",
  },
  theme: {
    switchToLight: "Switch To Light Theme",
    switchToDark: "Switch To Dark Theme",
  },
};

export default translation;
