import { useMutation, useQuery, useQueryClient } from "react-query";
import { useParams } from "react-router-dom"
import { EngagementService } from "../../services/engagement.service";
import { ActionIcon, Button, Drawer, Group, LoadingOverlay, ScrollArea, SimpleGrid, Table, Text, TextInput, rem } from "@mantine/core";
import { App, Divider,Modal,Popconfirm,Popover,Tag, Timeline,Button as Buttond, Badge } from "antd";
import { Dropzone, FileWithPath, PDF_MIME_TYPE } from '@mantine/dropzone';
import { FaArrowRight, FaClock, FaComment, FaDotCircle, FaEye, FaFilePdf, FaTrash, FaUpload } from "react-icons/fa";
import { FaMessage, FaX } from "react-icons/fa6";
import { useDisclosure } from "@mantine/hooks";
import { compareDesc, format, isBefore } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { DocEngagementService } from "../../services/docengagement.service";
import { useState } from "react";
import { useForm } from "@mantine/form";
import { yupResolver } from 'mantine-form-yup-resolver';
import * as yup from 'yup';
import { CommentaireService } from "../../services/commentaire.service";
import useAuthUser from "react-auth-kit/hooks/useAuthUser";
import { EngagementStateService } from "../../services/engagementstate.service";
import { Can } from "../../acl/Can";
import { useAppStore } from "../../common/Loader/store";
import { EtatEngagement, USER_ROLE } from "../../acl/Ability";
import { GrValidate } from "react-icons/gr";
import { FcDisapprove } from "react-icons/fc";
import { ToWords } from 'to-words';
import pdfMake from "pdfmake/build/pdfmake";
import {font} from "../../vfs_fonts";
pdfMake.vfs = font;
import { drapeau } from "./drapeau";
import { logo } from "./logo";

const formatNumber = (n: number) => String(n).replace(/(.)(?=(\d{3})+$)/g,'$1 ');

const toWords = new ToWords({
  localeCode: 'fr-FR',
  converterOptions: {
    currency: false,
    ignoreDecimal: false,
    ignoreZeroCurrency: false,
    doNotAddOnly: false,
    },
});


const StateMatch:any =  {
  BROUILLON : {value:'Engagement Brouillon',color:'grey'},
  SOUMIS: {value:'Engagement soumis',color:'black'},
  VALIDE:{value:'Engagement validé',color:'blue'},
  REJETE: {value:'Engagement rejeté',color:'red'},
  INVALIDE :{value:'Engagement invalidé',color:'orange'},
  PAYE :{value:'Engagement payé',color:'green'}
}

const Content = ({engagement} : any) => {
  const formatDate = (date: string) => format(date,'dd/MMMM/yyyy',{locale:fr});
    return <>
    <div className="flex flex-col space-y-2 p-2 w-150 text-white">
        <div className="font-semibold">Date: {formatDate(engagement?.date)}</div>
        <div className="font-semibold">Ligne de Credit : {engagement?.credit.souscompte.libelle}</div>
        <div className="font-semibold">Objet: {engagement?.objet}</div>
        <div className="font-semibold">Bénéficiaire : {engagement?.fournisseur ? engagement?.fournisseur.denomination : engagement?.beneficiaire}</div>
        <div className="font-semibold">Montant: {engagement?.montant}</div>
    </div>
    </>
}

const schema = yup.object().shape({
  nom: yup.string().required('Invalid nom'),
  engagement: yup.string().required('Engagement Invalide')
});

const schemaCom = yup.object().shape({
  contenu: yup.string().min(3,'minimun 3 caractères svp!').required('Invalid contenu'),
  engagement: yup.string().required('Engagement Invalide'),
  auteur: yup.string().min(3,'minimun 3 caractères svp!').required('Engagement Invalide')
});


function Engagement() {
const {id} = useParams()
const auth:{prenom: string,nom: string,id: string,fonction: string} | null =  useAuthUser();
const { role } = useAppStore() as any;
const {message} = App.useApp();
const qc = useQueryClient();
const [states,setStates] = useState<any[]>([])
const [files, setFiles] = useState<FileWithPath[]>([]);
const [isModalOpen, setIsModalOpen] = useState(false);

const form = useForm({
   initialValues:{
    nom:'',
    engagement: id
   },
   validate: yupResolver(schema),
});

const formCom = useForm({
  initialValues:{
   contenu:'',
   engagement: id,
   auteur: auth?.id,
  },
  validate: yupResolver(schemaCom),
});

const showModal = () => {
  setIsModalOpen(true);
};


const handleCancel = () => {
  setIsModalOpen(false);
};
const engagementService = new EngagementService();
const docEngagementService = new DocEngagementService();
const commentaireService = new CommentaireService();
const engagementStateService = new EngagementStateService();
const [opened, { open, close }] = useDisclosure(false);
const key = ['get_engagement',id];
const keydocs = ["get_Docs",id];
const keyCom = ['get_Commentaires',id];
const keyState = ["get_States",id];
const {data,isLoading} = useQuery(key, () => engagementService.getOne(id!));
const {mutateAsync,isLoading:loadingCr} = useMutation((idC:string) => engagementService.byCredit(idC));
const previews = files.map((file, index) => {
  return <Tag color="blue"  key={index}>{file.path} </Tag>;
});

const {data: docs,isLoading: loadingDocs} = useQuery(keydocs,() => docEngagementService.getByEngagement(id!));
const {data: commentaires,isLoading: loadingCom} = useQuery(keyCom,() => commentaireService.getByEngagement(id!));
const {isLoading: loadingState} = useQuery(keyState,() => engagementStateService.getByEngagement(id!),{
  onSuccess:(_) => {
    const st = _.sort((a:any,b: any) => compareDesc(a.createdAt,b.createdAt)).map((s:any) => ({
      contenu: `${StateMatch[s.etat].value} par ${s.auteur.prenom} ${s.auteur.nom}  le ${format(s.createdAt,'dd/MM/yyyy H:m:s',{locale:fr})}`,
      color: StateMatch[s.etat].color,
      isPending: s.etat === 'SOUMIS',
    }))
  setStates(st);
  }
});
const {mutate:uploadDocs,isLoading:loadingUpldoc} = useMutation((data: FormData) => docEngagementService.create(data),{
  onSuccess:(_) => {
    message.success("Enregistrement des fichiers effectué");
    qc.invalidateQueries(keydocs);
    setFiles([]);
  }
})
const {mutate:createCommentaire,isLoading:loadingCreateCom} = useMutation((data: any) => commentaireService.create(data),{
  onSuccess:(_) => {
    message.success("Enregistrement du commentaire effectué");
    qc.invalidateQueries(keyCom);
    formCom.reset()
  }
});

const {mutate:updateState,isLoading:loadingUpdateSate} = useMutation((data: any) => engagementService.changeState(id!,data),{
  onSuccess:(_) => {
    message.success("L' état de l'engagement à été modifié");
    qc.invalidateQueries(key);
    qc.invalidateQueries(keyState);
  },
  onError:(error) => {
    message.error(`Une erreur est survenue :  ${error}`);
  }
})

const {mutate:deleteDoc,isLoading:loadingDelete} = useMutation((id:string) => docEngagementService.delete(id),{
  onSuccess:(_) => {
      message.success("La suppression est effective.");
      qc.invalidateQueries(keydocs);
  },
  onError:(_) => {
  message.error('Erreur de Suppression');
  }
});

const {mutate:deleteCommentaire,isLoading:loadingDeleteCommentaire} = useMutation((id:string) => commentaireService.delete(id),{
  onSuccess:(_) => {
      message.success("Le Commentaire  a été supprimé!");
      qc.invalidateQueries(keyCom);
  },
  onError:(_) => {
  message.error('Erreur de Suppression');
  }
});

const uploadFiles = () => {
  if(form.isValid()){
  const {engagement,nom} = form.values;
  setIsModalOpen(false);
  if(files.length !== 0){
  const fd = new FormData();
   fd.append('engagement', engagement!);
   fd.append('nom',nom);
   for (let i=0;i<files.length;i++){
    fd.append("files", files[i] as Blob);
   }
    uploadDocs(fd);
  }
  }
  else {
    message.error('Le formulaire est Invalide !')
  }
  
}

const generateMandat = async () => {
  const mandatByCredit = await mutateAsync(data?.credit?._id);
  const lastm = mandatByCredit.filter((b:any) => isBefore(b.date,data?.date));
  const totalLastMandat = lastm.reduce((acc: any,cur: any) => acc + cur.montant,0);
  const docDefinition:any = {
    styles: {
      entete: {
          bold: true,
          alignment:'center',
          fontSize:10
      },
      center: {
          alignment:'center',
      },
      left: {
        alignment:'left',
    },
    right: {
      alignment:'right',
  },
      nombre: {
        alignment:'right',
        fontSize:10,
        bold: true
    },
       info: {
        fontSize:6,
    },
      header3: {
          color:"white",
          fillColor: '#73BFBA',
          bold: true,
          alignment:'center',
          fontSize:6,
      },
      header4: {
        color:"white",
        fillColor: '#73BFBA',
        bold: true,
        alignment:'right',
        fontSize:6
    },
      total:{
          color:"white",
          bold: true,
          fontSize:6,
          fillColor:'#73BFBA',
          alignment:'center'
      },
      anotherStyle: {
        italics: true,
        alignment: 'right'
      }
    },
    content:[{
      columnGap: 100,
      columns: [
        {
        with: 'auto',
        alignment:'left',
        stack: [
          {text:"REPUBLIQUE DU SENEGAL\n",fontSize: 10,bold: true,alignment:"center"},
          {text:"Un Peuple, Un but, Une Foi\n",fontSize: 10,bold: true,margin:[0,2],alignment:"center"},
          {image:drapeau,width: 40,alignment:"center"},
          {text:"MINISTERE DE L'ENSEIGNEMENT SUPERIEUR DE LA RECHERCHE ET DE L'INNOVATION \n",fontSize: 10,bold: true,margin:[0,2],alignment:"center"},
          {text:"CENTRE REGIONAL DES OEUVRES UNIVERSITAIRES SOCIALES DE ZIGUINCHOR\n",fontSize: 10,bold: true,margin:[0,2],alignment:"center"},
          {text:"DIVISION DES AFFAIRES FINANCIERS",fontSize: 10,bold: true,alignment:"center"}
        ]},
        
        {
          with:'auto',
          alignment:'right',
          stack:[
            {image:logo,width: 80,alignment:"right"},
            {text:`Assigné payable par l'agent comptable : `,fontSize: 10,bold: true,margin:[0,2],alignment:"right"},
            {text:`BUDGET : ${data?.credit.budget?.annee}`,fontSize: 10,bold: true,alignment:"right"},
            {text:`DATE D'EMISSION : ${format(data?.date,'dd/MM/yyyy')}`,fontSize: 10,bold: true,alignment:"right"},
          ]
          
        }
      ]
    },
    {
      margin: [0,10],
      fillColor:"#8E44AD",
      alignment:'center',
      layout:'noBorders',
      table: {
        widths: ['100%'],
        body: [
          [ {text:` MANDAT DE PAIEMENT N° #${data?.numero}`,fontSize: 16,bold: true,color:'white',margin:[0,4]}],
        ]
      }
    },
    {text:`BENEFICIAIRE : ${data?.beneficiaire ?? ''} | ${data?.fournisseur?.denomination ?? ''}`,fontSize: 10,bold: true,},
    {text:`OBJET : ${data?.objet}`,fontSize: 10,bold: true},
    {
      margin: [4,4,4,4],
      alignment: 'justify',
      layout: {
        fillColor: function (rowIndex:number, node:any, columnIndex:number) {
          return (rowIndex === 0) ? 'beige' : null;
        }
      },
      table: {
        widths: ['40%', '40%','20%'],
          body: [
              [{text:'IMPUTATION BUDGETAIRE',style:'entete'}, {text:'PIECES JUSTIFICATIVES',style:'entete'}, {text:'MONTANT BRUT',style:'entete'}],
              [{text:`${data?.credit.souscompte.code} \n--------------\n${data?.credit.souscompte.libelle}`}, {text: docs?.map((d:any) => d.nom).join('\n'),fontSize:10}, {text: formatNumber(data?.montant),style:'nombre'}],
          ],
      }
  },
  {text:`Arrété par nous, le présent mandat de paiement à la somme de  :`,fontSize: 12,bold: true},
  {text:`${toWords.convert(data?.montant)} FCFA`,fontSize: 12,bold: true,alignment:'center',background:'beige', margin:[0,5,0,5]},
  {
    margin: [4,4,4,0],
    alignment: 'justify',
    layout: {
      fillColor: function (rowIndex:number, node:any, columnIndex:number) {
        return (rowIndex === 0) ? 'beige' : null;
      }
    },
    table: {
      widths: ['50%', '50%'],
        body: [
            [{text:'INFORMATIONS BANCAIRES',style:'entete'}, {text:'CADRE RESERVE A L\'ORDONNATEUR',style:'entete'}],
            [{text:`\n\n\nN°COMPTE : ${data?.fournisseur?.compte_bancaire ?? ''} \n--------------\nBANQUE : ${data?.fournisseur?.domiciliation?.libelle ?? ''}\n\n\n`},{text: ''}] ,
        ],
    }
},
{
  margin: [5,5,5,0],
  alignment: 'justify',
  layout: {
    fillColor: function (rowIndex:number, node:any, columnIndex:number) {
      return (rowIndex === 0) ? 'beige' : null;
    }
  },
  table: {
    widths: ['100%'],
      body: [
          [{text:'CADRE RESERVE A L\'AGENT COMPTABLE',style:'entete'}],
          [{text:`\n\n\n\n\n\n\n\n\n`}] ,
      ],
  }
},
{ qr: `${data?.numero}`, foreground: '#8E44AD',margin:[0,10],fit: '80',eccLevel:'M' },
{text:`CENTRE REGIONAL DES OEUVRES UNIVERSITAIRES SOCIALES DE ZIGUINCHOR`,fontSize: 8,bold: true,alignment: 'center',pageBreak:'after'},


{
  columnGap: 100,
  columns: [
    {
    with: 'auto',
    alignment:'left',
    stack: [
      {text:"REPUBLIQUE DU SENEGAL\n",fontSize: 10,bold: true,alignment:"center"},
      {text:"Un Peuple, Un but, Une Foi\n",fontSize: 10,bold: true,margin:[0,2],alignment:"center"},
      {image:drapeau,width: 40,alignment:"center"},
      {text:"MINISTERE DE L'ENSEIGNEMENT SUPERIEUR DE LA RECHERCHE ET DE L'INNOVATION \n",fontSize: 10,bold: true,margin:[0,2],alignment:"center"},
      {text:"CENTRE REGIONAL DES OEUVRES UNIVERSITAIRES SOCIALES DE ZIGUINCHOR\n",fontSize: 10,bold: true,margin:[0,2],alignment:"center"},
      {text:"DIVISION DES AFFAIRES FINANCIERS",fontSize: 10,bold: true,alignment:"center"}
    ]},
    
    {
      with:'auto',
      alignment:'right',
      stack:[
        {image:logo,width: 80,alignment:"right"},
        {text:`BUDGET : ${data?.credit.budget?.annee}`,fontSize: 10,bold: true,alignment:"right"},
        {text:`DATE D'EMISSION : ${format(data?.date,'dd/MM/yyyy')}`,fontSize: 10,bold: true,alignment:"right"},
      ]
      
    }
  ]
},
{
  margin: [0,10],
  fillColor:"#8E44AD",
  alignment:'center',
  layout:'noBorders',
  table: {
    widths: ['100%'],
    body: [
      [ {text:`FICHE D'ENGAGEMENT N° ${data?.numero}`,fontSize: 16,bold: true,color:'white',margin:[0,4]}],
    ]
  }
},
{
  margin: [5,5,5,5],
  alignment: 'justify',
  layout: {
    hLineStyle: function (i: number, node: any) {
      return {dash: {length: 2, space: 4}};
    },
    vLineStyle: function (i: number, node: any) {
      return {dash: {length: 2}};
    }
  },
  table: {
    widths: ['40%', '40%','20%'],
      body: [
          [{text:' OBJET DE L\'ENGAGEMENT'}, {text:' BENEFICIAIRE'}, {text:' MONTANT'}],
          [{text:`${data?.objet}`,fontSize:8}, {text: `${data?.beneficiaire ?? ''} | ${data?.fournisseur?.denomination ?? ''}`,fontSize:8}, {text: formatNumber(data?.montant),style:'nombre'}],
      ],
  }
},
{text:`COMPTE : ${data?.credit?.souscompte?.compte_divisionnaire?.compte?.code} ${data?.credit?.souscompte?.compte_divisionnaire?.compte?.libelle}`,fontSize: 10,bold: true,margin:[0,2]},
{text:`COMPTE DIVISIONNAIRE : ${data?.credit?.souscompte?.compte_divisionnaire?.code} ${data?.credit?.souscompte?.compte_divisionnaire?.libelle}`,fontSize: 10,bold: true,margin:[0,2]},
{text:`SOUS COMPTE : ${data?.credit?.souscompte?.code} ${data?.credit?.souscompte?.libelle}`,fontSize: 10,bold: true,margin:[0,2]},
{
  margin:[0,4],
  alignment:'right',
  columns:[
  {text:`MANDAT N° MDT# ${data?.numero}  ${data?.etat}`,fontSize: 8,bold: true,margin:[0,2],background:'beige'}
]},
{
  margin:[0,1],
  columnGap: 0,
  columns:[
  {text:` BUDEGET PRIMITIF : `,fontSize: 12,bold: true,margin:[0,2],background:'beige'},
  {text:`${formatNumber(data?.credit?.prevision)}`,fontSize: 10,bold: true,margin:[0,2],background:'beige'},
]},
{
  margin:[0,1],
  columnGap: 0,
  columns:[
  {text:`  Autorisations Speciales : `,fontSize: 10,bold: true,margin:[0,2]},
  {text:`0`,fontSize: 10,bold: true,margin:[0,2]},
]},
{
  margin:[0,1],
  columnGap: 0,
  columns:[
  {text:`  Virements de crédit en plus : `,fontSize: 10,bold: true,margin:[0,2]},
  {text:`0`,fontSize: 10,bold: true,margin:[0,2]},
]},
{
  margin:[0,1],
  columnGap: 0,
  columns:[
  {text:`  Virements de crédit en moins : `,fontSize: 10,bold: true,margin:[0,2]},
  {text:`0`,fontSize: 10,bold: true,margin:[0,2]},
]},
{
  margin:[0,1],
  columnGap: 0,
  columns:[
  {text:`  MONTANT LIGNE DE CREDIT : `,fontSize: 12,bold: true,margin:[0,2],background:'beige'},
  {text:`${formatNumber(data?.credit?.prevision)}`,fontSize: 10,bold: true,margin:[0,2],background:'beige'},
]},
{
  svg: '<svg height="2" width="600" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="0" x2="600" y2="0" style="stroke:black;stroke-width:2" /></svg>',
  width: 600
},
{
  margin:[0,1],
  columnGap: 0,
  columns:[
  {text:` ENGAGEMENTS ANTERIEURS : `,fontSize: 10,bold: true,margin:[0,2]},
  {text:`${formatNumber(totalLastMandat)}`,fontSize: 10,bold: true,margin:[0,2]},
]},
{
  margin:[0,1],
  columnGap: 0,
  columns:[
  {text:` PRESENT ENGAGEMENT : `,fontSize: 10,bold: true,margin:[0,2]},
  {text:`${formatNumber(data?.montant)}`,fontSize: 10,bold: true,margin:[0,2]},
]},
{
  margin:[0,1],
  columnGap: 0,
  columns:[
  {text:`  TOTAL ENGAMENTS : `,fontSize: 10,bold: true,margin:[0,2]},
  {text:`${formatNumber(totalLastMandat + data?.montant)}`,fontSize: 10,bold: true,margin:[0,4]},
]},
{
  margin:[0,1],
  columnGap: 0,
  columns:[
  {text:` SOLDE LIGNE DE CREDIT : `,fontSize: 12,bold: true,margin:[0,2],background:'beige'},
  {text:`${formatNumber(data?.credit?.prevision - (totalLastMandat + data?.montant))}`,fontSize: 10,bold: true,margin:[0,4],background:'beige'},
]},
{
  svg: '<svg height="2" width="600" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="0" x2="600" y2="0" style="stroke:black;stroke-width:2" /></svg>',
  width: 600
},
{
  margin: [5,5,5,5],
  alignment: 'justify',
  table: {
    widths: ['50%', '50%'],
      body: [
          [{text:' CADRE RESERVE A L\'ORDONNATEUR',style:'entete',fillColor:'#8E44AD',color:'white'}, {text:' CADRE RESERVE A L\'AGENT COMPTABLE',style:'entete',fillColor:'beige'}],
          [{text:`\n \n \n \n\n \n \n\n \n`},{text: ''}] ,
      ],
  }
},
{ qr: `${data?.numero}`, foreground: '#8E44AD',margin:[0,5],fit: '80',eccLevel:'M' },
{text:`CENTRE REGIONAL DES OEUVRES UNIVERSITAIRES SOCIALES DE ZIGUINCHOR`,fontSize: 8,bold: true,alignment: 'center'},
  ]
  }
  
    pdfMake.createPdf(docDefinition).open();
  }

const createComment = (values:any) => {
    createCommentaire(values);
}

const confirm = (id : string) => {
  deleteDoc(id)
};

const confirmDelCom = (id : string) => {
  deleteCommentaire(id)
};

const handleSubmit = () => {
  updateState({auteur:auth?.id,engagement:id,etat: EtatEngagement.SOUMIS});
}

const handleBrouillon = () => {
  updateState({auteur:auth?.id,engagement:id,etat: EtatEngagement.BROUILLON});
}

const handleValidate = () => {
  updateState({auteur:auth?.id,engagement:id,etat: EtatEngagement.VALIDE});
}

const handleInvalidate = () => {
  updateState({auteur:auth?.id,engagement:id,etat: EtatEngagement.INVALIDE});
}

const handlePaye = () => {
  updateState({auteur:auth?.id,engagement:id,etat: EtatEngagement.PAYE});
}

const handleReject = () => {
  updateState({auteur:auth?.id,engagement:id,etat: EtatEngagement.REJETE});
}

const cancel = () => {
  message.info("L'action a été annulé !");
};

const reSetFiles = (files: FileWithPath[]) => {
  form.reset();
  form.setFieldValue('engagement',id);
  setFiles(files);
}

const ViewDoc = (path: string) => {
  const fullPath = import.meta.env.VITE_BACKURL + "/uploads/engagements-files/"+ path ;
  window.open(fullPath,'_blank')?.focus();
}

  return (
    <>
    <LoadingOverlay
         visible={isLoading || loadingDocs || loadingDelete || loadingCom || loadingDeleteCommentaire || loadingCreateCom  || loadingState || loadingUpdateSate}
         zIndex={1000}
         overlayProps={{ radius: 'sm', blur: 2 }}
         loaderProps={{ color: 'blue', type: 'bars' }}
       />
       <div className="w-full flex items-center justify-between my-5">
       <Button onClick={open} leftSection={<FaEye />}>Voir journal des etats</Button>

       {((role === USER_ROLE.DAF)  || (role === USER_ROLE.BUDGET)) && <Button bg="green" leftSection={<FaFilePdf />} onClick={generateMandat}>Generer mandat</Button>}
       </div>
      <div className="flex">
        <div className="w-full">
            <div className="w-full flex items-center space-x-4 flex-wrap space-y-2">
            {data && <>
            <Badge.Ribbon text={data.etat} color={StateMatch[data.etat].color}>
            <Popover content={<Content engagement={data}/>} title={<div className="text-white ">ENGAGEMENT N°{data?.numero}</div>} color={StateMatch[data.etat].color}>
              <h4 className="p-2 bg-slate-500 text-white font-semibold cursor-pointer rounded-md pr-20">FICHE D'ENGAGEMENT N°:{data?.numero}</h4>
              </Popover>
            </Badge.Ribbon>
                <div className="flex flex-wrap space-x-1">
                <Can I={role} a={EtatEngagement.SOUMIS} field={data?.etat}>
                  <Button bg={"grey"} rightSection={<FaMessage />} onClick={handleSubmit}>SOUMETTRE</Button>
                </Can>
                <Can I={role} a={EtatEngagement.BROUILLON} field={data?.etat}>
                  <Button bg={"red"} rightSection={<FcDisapprove />} onClick={handleBrouillon}>ANNULER</Button>
                </Can>
                <Can I={role} a={EtatEngagement.VALIDE} field={data?.etat}>
                  <Button bg={"blue"} rightSection={<GrValidate />} onClick={handleValidate}>VALIDER</Button>
                </Can>
                <Can I={role} a={EtatEngagement.INVALIDE} field={data?.etat}>
                  <Button bg={"red"} rightSection={<FcDisapprove />} onClick={handleInvalidate}>INVALIDE</Button>
                </Can>
                <Can I={role} a={EtatEngagement.PAYE} field={data?.etat}>
                  <Button bg={"green"} rightSection={<GrValidate />} onClick={handlePaye}>PAYE</Button>
                </Can>
                <Can I={role} a={EtatEngagement.REJETE} field={data?.etat}>
                  <Button bg={"red"} rightSection={<FcDisapprove />} onClick={handleReject}>REJETE</Button>
                </Can>
                </div>
            </> 
                }
            </div>
            <Divider className="w-96" />
             <div>
             {(role === USER_ROLE.DAF  || role === USER_ROLE.BUDGET) && <> 
              <Dropzone
                    h={200}
                    loading={loadingUpldoc}
                    onDrop={(files) => reSetFiles(files)}
                    onReject={() => message.error(`Formats acceptés : .pdf`) }
                    maxSize={10 * 1024 ** 2}
                    accept={PDF_MIME_TYPE}
                        >
                <Group justify="center" gap="xl" mih={150} style={{ pointerEvents: 'none' }}>
                <Dropzone.Accept>
                  <FaUpload
                    style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-blue-6)' }}
                  />
                </Dropzone.Accept>
                <Dropzone.Reject>
                  <FaX
                    style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-red-6)' }}
                  />
                </Dropzone.Reject>
                <Dropzone.Idle>
                  <FaFilePdf
                    style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-green-6)' }}
                  />
                </Dropzone.Idle>

                <div>
                  <Text size="xl" inline>
                    Glissez et déposez un fichier PDF ou cliquez pour en ajouter un.
                  </Text>
                  <Text size="sm" c="dimmed" inline mt={7}>
                  Chaque ficher ne devra pas excéder 10 Mo.
                  </Text>
                </div>
              </Group>
            </Dropzone>
            <SimpleGrid cols={{ base: 1, sm: 4 }} mt={previews.length > 0 ? 'xl' : 0}>
                {previews}
              </SimpleGrid>
            <Button className="w-full mx-2 my-2" leftSection={<FaUpload />} onClick={showModal}>Ajouter pièces jointes</Button>
              </>}
           
            <Divider />
            <div className="p-2 font-semibold bg-green-500 text-white text-lg">Liste des pièces jointes :</div>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>NOM</Table.Th>
                  <Table.Th>DATE</Table.Th>
                  <Table.Th>ACTION</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
              {docs?.map((d:any) => (
                <Table.Tr key={d._id}>
                <Table.Td>{d.nom}</Table.Td>
                <Table.Td>{format(d.date || d.createdAt,'dd/MM/yyyy',{locale:fr})}</Table.Td>
                <Table.Td>
                <Buttond
                  type="primary"
                  icon={<FaEye className="text-blue-400"
                  />}
                  onClick={() => ViewDoc(d.path)}
                />
                {(role === USER_ROLE.DAF  || role === USER_ROLE.BUDGET) && <Popconfirm
                title="Suppression"
                description="Etes vous sure de supprimer?"
                onConfirm={() => confirm(d._id)}
                onCancel={() => cancel()}
                okText="Confirmer"
                okButtonProps={{className: "bg-blue-500"}}
                cancelButtonProps={{className: "bg-red-500"}}
                cancelText="Annuler"
              >
                <Buttond
                  type="primary"
                  icon={<FaTrash className="text-red-500"/>}
                  loading={loadingDelete}
                />
                </Popconfirm>}
                </Table.Td>
              </Table.Tr>
              ))}
              </Table.Tbody>
            </Table>
            </div>
        
  </div>
        <Divider className="h-96" type="vertical" />

     {/* Composant de commentaire */}

        <div className="w-full">
        <div className="p-2 font-semibold bg-blue-400 text-white text-md rounded-md mb-2">COMMENTAIRES</div>
        {/* <!-- Chat Bubble --> */}
      <ScrollArea h={300}>
        <ul className="space-y-3">
  {/* <!-- Chat --> */}
  {commentaires?.map( (c:any) => (
    <li key={c._id} className={c.auteur._id === auth?.id ? "max-w-lg flex gap-x-2 sm:gap-x-4 justify-end text-wrap" : "max-w-lg flex gap-x-2 sm:gap-x-4 text-wrap"}>
    {/* <!-- Card --> */}
    <div className={c.auteur._id === auth?.id ? "bg-blue-200 border border-blue-200 rounded-2xl p-2 space-y-2 dark:bg-slate-900 dark:border-gray-700":
  "bg-white border border-blue-200 rounded-2xl p-2 space-y-2 dark:bg-slate-900 dark:border-gray-700"
  }>
      <div className="font-semibold text-sm text-gray-800 dark:text-white max-w-72 break-words">
       {c.contenu}
      </div>
      <Divider/>
      <div className="flex items-center space-x-2">
        <Text size="xs"  c="dimmed" className="text-gray-800 dark:text-white">
         {format(c.createdAt,'dd/MMMM/yyyy H:m:s',{locale:fr})}
        </Text>
        {c.auteur._id === auth?.id && <Popconfirm
        title="Suppression"
        description="Etes vous sure de supprimer?"
        onConfirm={() => confirmDelCom(c._id)}
        onCancel={() => cancel()}
        okText="Confirmer"
        okButtonProps={{className: "bg-blue-500"}}
        cancelButtonProps={{className: "bg-red-500"}}
        cancelText="Annuler"
      >
        <Buttond
          type="primary"
          icon={<FaTrash className="text-red-500"/>}
          loading={loadingDeleteCommentaire}
        />
        </Popconfirm>}
      </div>
      <Text size="xs"  c="dimmed" className="text-gray-800 dark:text-white">{`${c.auteur.prenom} ${c.auteur.nom}`}</Text>
    </div>
    {/* <!-- End Card --> */}
  </li>
  ))}

  {/* <!-- End Chat Bubble --> */}
</ul>
      </ScrollArea>

{/* <!-- End Chat Bubble --> */}
<div className="my-10 mx-5">
      <form  onSubmit={formCom.onSubmit(createComment)}>
      <TextInput
      radius="xl"
      size="md"
      {...formCom.getInputProps('contenu')}
      placeholder="Entrer votre commentaire..."
      rightSectionWidth={42}
      leftSection={<FaComment style={{ width: rem(18), height: rem(18) }}/>}
      rightSection={
        <ActionIcon type="submit" size={32} radius="xl" color='blue' variant="filled">
          <FaArrowRight style={{ width: rem(18), height: rem(18) }}/>
        </ActionIcon>
      }
    />
      </form>
      
</div>

        </div>
      </div>
      <Drawer opened={opened} onClose={close} title="JOURNAL DES ETATS">
      <Timeline
      className="my-10 mx-2"
      mode="alternate"
    items={states?.map(s => (
      {
        dot: s.isPending ? <FaClock style={{ fontSize: '16px' }} /> : <FaDotCircle />,
        color: s.color,
        children: <Text c={s.color}>{s.contenu}</Text>,
      }
    ))}
  />

      </Drawer>
      <Modal title="Noms Fichiers" open={isModalOpen} okButtonProps={{className:"bg-blue-400"}} onOk={uploadFiles} onCancel={handleCancel}>
        <form onSubmit={(e) => e.preventDefault()}>
          <TextInput
          withAsterisk
          label="DESIGNATION FICHIERS"
          {...form.getInputProps('nom')}
          />
        </form>
      </Modal>
    </>
  )
}

export default Engagement