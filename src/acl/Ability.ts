import { defineAbility } from '@casl/ability';

export enum USER_ROLE {
    ADMIN = 'admin',
    DAF = 'daf',
    CSA = 'csa',
    BUDGET = 'budget',
    ACP = 'acp',
    CONTROLE = 'controle'
  }

  export enum EtatEngagement {
    BROUILLON = 'BROUILLON',
    SOUMIS = 'SOUMIS',
    VALIDE = 'VALIDE',
    REJETE = 'REJETE',
    INVALIDE = 'INVALIDE',
    PAYE = 'PAYE'
}

export default defineAbility((can,cannot) => {
//admin
 can(USER_ROLE.ADMIN,'VALIDE',EtatEngagement.SOUMIS);
 can(USER_ROLE.ADMIN,'VALIDE',EtatEngagement.INVALIDE);
 can(USER_ROLE.ADMIN,'INVALIDE',EtatEngagement.SOUMIS);
 can(USER_ROLE.ADMIN,'INVALIDE',EtatEngagement.VALIDE);
 cannot(USER_ROLE.ADMIN,'SOUMIS',EtatEngagement.BROUILLON);
 cannot(USER_ROLE.ADMIN,'PAYE',EtatEngagement.VALIDE);
 cannot(USER_ROLE.ADMIN,'REJETE',EtatEngagement.VALIDE);
 cannot(USER_ROLE.ADMIN,'CREATE_ENGAGEMENT');
 cannot(USER_ROLE.ADMIN,'CREATE_BORDEREAU');
 cannot(USER_ROLE.ADMIN,'CREATE_CREDIT');
 // budget
 can(USER_ROLE.BUDGET,'CREATE_ENGAGEMENT');
 can(USER_ROLE.BUDGET,'CREATE_BORDEREAU');
 can(USER_ROLE.BUDGET,'CREATE_CREDIT');
 can(USER_ROLE.BUDGET,'SOUMIS',EtatEngagement.BROUILLON);
 can(USER_ROLE.BUDGET,'BROUILLON',EtatEngagement.SOUMIS);
 cannot(USER_ROLE.BUDGET,'PAYE',EtatEngagement.VALIDE);
 cannot(USER_ROLE.BUDGET,'REJETE',EtatEngagement.VALIDE);
 cannot(USER_ROLE.BUDGET,'SOUMIS',EtatEngagement.INVALIDE);
 cannot(USER_ROLE.BUDGET,'VALIDE',EtatEngagement.SOUMIS);
 cannot(USER_ROLE.BUDGET,'INVALIDE',EtatEngagement.SOUMIS);
 //daf
 can(USER_ROLE.DAF,'CREATE_ENGAGEMENT');
 can(USER_ROLE.DAF,'CREATE_BORDEREAU');
 can(USER_ROLE.DAF,'CREATE_CREDIT');
 can(USER_ROLE.DAF,'SOUMIS',EtatEngagement.BROUILLON);
 can(USER_ROLE.DAF,'BROUILLON',EtatEngagement.SOUMIS);
 cannot(USER_ROLE.DAF,'PAYE',EtatEngagement.VALIDE);
 cannot(USER_ROLE.DAF,'REJETE',EtatEngagement.VALIDE);
 cannot(USER_ROLE.DAF,'SOUMIS',EtatEngagement.INVALIDE);
 cannot(USER_ROLE.DAF,'VALIDE',EtatEngagement.SOUMIS);
 cannot(USER_ROLE.DAF,'INVALIDE',EtatEngagement.SOUMIS);

 //acp

 can(USER_ROLE.ACP,'PAYE',EtatEngagement.VALIDE);
 can(USER_ROLE.ACP,'PAYE',EtatEngagement.REJETE);
 can(USER_ROLE.ACP,'REJETE',EtatEngagement.PAYE);
 can(USER_ROLE.ACP,'REJETE',EtatEngagement.VALIDE);
 cannot(USER_ROLE.ACP,'CREATE_ENGAGEMENT');
 cannot(USER_ROLE.ACP,'CREATE_BORDEREAU');
 cannot(USER_ROLE.ACP,'CREATE_CREDIT');
 cannot(USER_ROLE.ACP,'VALIDE',EtatEngagement.SOUMIS);
 cannot(USER_ROLE.ACP,'INVALIDE',EtatEngagement.SOUMIS);
 cannot(USER_ROLE.ACP,'SOUMIS',EtatEngagement.BROUILLON);
});
