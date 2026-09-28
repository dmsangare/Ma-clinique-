import React, { useState, useEffect } from "react";
import { User, Patient } from "../types.ts";
import { DmgLabScenario } from "./DmgLabScenario.tsx";

interface DmgModuleViewProps {
  token: string | null;
  patients: Patient[];
  currentUser: User;
  clinicThemeColor: string;
  initialPatientId?: string | null;
  onClearInitialPatientId?: () => void;
}

// Structuring our state-based data models
interface StaffMember {
  id: string;
  name: string;
  role: "Médecin Chef" | "Infirmier" | "Aide-soignant" | "Stagiaire";
  status: "Présent" | "En garde" | "Congé" | "Absent";
  guardsCount: string;
  duty: string;
}

interface AssignedTask {
  id: string;
  title: string;
  priority: "URGENT" | "NORMAL" | "BASSE";
  staffName: string;
  schedule: string;
  status: "En cours" | "Terminée" | "Annulée";
}

interface GuardDay {
  day: number;
  name: string;
  jourAssignee?: string;
  nuitAssignee?: string;
  weAssignee?: string;
  rempalcementAssignee?: string;
  tasksCount?: number;
  isEmpty?: boolean;
}

interface CustomPrescription {
  id: string;
  name: string;
  dosage: string;
  duration: string;
}

export const DmgModuleView: React.FC<DmgModuleViewProps> = ({
  token,
  patients = [],
  currentUser,
  clinicThemeColor,
  initialPatientId,
  onClearInitialPatientId
}) => {
  // Inject FontAwesome stylesheet to support all specified icons exactly
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Set initial selected patient state (MédiSahel patient list handling with demo fallback)
  const demoPatient: Patient = {
    id: "demo-dupont",
    firstName: "Marie",
    lastName: "DUPONT",
    nationalId: "1 85 12 345 678",
    dateOfBirth: "1981-06-15",
    gender: "F",
    phone: "+223 76 54 87 12",
    email: "marie.dupont@sante.fr",
    bloodType: "A+",
    allergies: "Allergie pénicilline",
    address: "Korofina Nord, Bamako",
    ethnie: "Bambara",
    nationalite: "Malienne",
    maritalStatus: "Marié",
    profession: "Formatrice",
    commune: "Commune I",
    quartier: "Korofina",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const [activePatient, setActivePatient] = useState<Patient>(demoPatient);

  // Synchronize on initialPatientId prop if supplied
  useEffect(() => {
    if (initialPatientId && patients.length > 0) {
      const found = patients.find(p => p.id === initialPatientId);
      if (found) {
        setActivePatient(found);
      }
      if (onClearInitialPatientId) {
        onClearInitialPatientId();
      }
    }
  }, [initialPatientId, patients, onClearInitialPatientId]);

  // Current sub-tab state (resume, consultation, examens, prescriptions, staff, documents, workflow)
  const [activeTab, setActiveTab] = useState<"resume" | "consultation" | "examens" | "prescriptions" | "staff" | "documents" | "workflow">("resume");

  // CONSULTATION FORM STATE
  const [motif, setMotif] = useState("Fièvre, toux, asthénie depuis 3 jours");
  const [anamnese, setAnamnèse] = useState("Patient présente une fièvre à 38.5°C, toux sèche, asthénie.");
  const [taMax, setTaMax] = useState("135/85");
  const [poids, setPoids] = useState("72");
  const [temp, setTemp] = useState("38.5");
  const [fc, setFc] = useState("88");
  const [examenClinique, setExamenClinique] = useState("Auscultation pulmonaire : encombrement basal gauche");

  // PRESCRIPTION DRUG LIST STATE
  const [prescriptionsList, setPrescriptionsList] = useState<CustomPrescription[]>([
    { id: "1", name: "Amoxicilline 500mg", dosage: "1 gélule x3/j", duration: "7 jours" },
    { id: "2", name: "Paracétamol 1g", dosage: "si besoin", duration: "max 3g/j" }
  ]);
  const [newMedName, setNewMedName] = useState("");
  const [newMedDosage, setNewMedDosage] = useState("");
  const [newMedDuration, setNewMedDuration] = useState("");

  // STAFF STATE
  const [staffList, setStaffList] = useState<StaffMember[]>([
    { id: "1", name: "Dr. Martin", role: "Médecin Chef", status: "Présent", guardsCount: "3 (2J/1N)", duty: "Supervision" },
    { id: "2", name: "Sophie Laurent", role: "Infirmier", status: "Présent", guardsCount: "4 (2J/2N)", duty: "Urgences" },
    { id: "3", name: "Jean Dupont", role: "Infirmier", status: "En garde", guardsCount: "5 (3J/2N)", duty: "Réanimation" },
    { id: "4", name: "Marie Dubois", role: "Aide-soignant", status: "Congé", guardsCount: "2 (1J/1N)", duty: "Soins" },
    { id: "5", name: "Paul Martin", role: "Stagiaire", status: "Présent", guardsCount: "1 (1J/0N)", duty: "Formation" },
    { id: "6", name: "Claire Petit", role: "Infirmier", status: "Absent", guardsCount: "0", duty: "—" }
  ]);

  // ASSIGNED TASKS STATE
  const [tasksList, setTasksList] = useState<AssignedTask[]>([
    { id: "task-1", title: "Surveillance post-opératoire", priority: "URGENT", staffName: "Sophie Laurent", schedule: "22/06 (Nuit)", status: "En cours" },
    { id: "task-2", title: "Préparation des perfusions", priority: "NORMAL", staffName: "Jean Dupont", schedule: "22/06 (Jour)", status: "En cours" },
    { id: "task-3", title: "Bilan des constantes (tous les patients)", priority: "NORMAL", staffName: "Marie Dubois", schedule: "22/06 (Jour)", status: "En cours" },
    { id: "task-4", title: "Accueil des urgences", priority: "URGENT", staffName: "Sophie Laurent", schedule: "23/06 (Nuit)", status: "En cours" }
  ]);

  // GARDES CALENDAR STATE
  const [gardesCalendar, setGardesCalendar] = useState<GuardDay[]>([
    // Week 1
    { day: 1, name: "Lun", jourAssignee: "S. Laurent", tasksCount: 3 },
    { day: 2, name: "Mar", jourAssignee: "J. Dupont", nuitAssignee: "C. Petit" },
    { day: 3, name: "Mer", nuitAssignee: "S. Laurent" },
    { day: 4, name: "Jeu", jourAssignee: "J. Dupont" },
    { day: 5, name: "Ven", jourAssignee: "S. Laurent", nuitAssignee: "P. Martin" },
    { day: 6, name: "Sam", weAssignee: "M. Dubois" },
    { day: 7, name: "Dim", weAssignee: "S. Laurent" },
    // Week 2
    { day: 8, name: "Lun", jourAssignee: "P. Martin" },
    { day: 9, name: "Mar", jourAssignee: "S. Laurent", nuitAssignee: "J. Dupont" },
    { day: 10, name: "Mer", jourAssignee: "M. Dubois" },
    { day: 11, name: "Jeu", nuitAssignee: "S. Laurent" },
    { day: 12, name: "Ven", jourAssignee: "J. Dupont" },
    { day: 13, name: "Sam", weAssignee: "C. Petit" },
    { day: 14, name: "Dim", weAssignee: "J. Dupont" },
    // Week 3
    { day: 15, name: "Lun", jourAssignee: "S. Laurent" },
    { day: 16, name: "Mar", jourAssignee: "P. Martin", nuitAssignee: "M. Dubois" },
    { day: 17, name: "Mer", jourAssignee: "J. Dupont" },
    { day: 18, name: "Jeu", nuitAssignee: "S. Laurent" },
    { day: 19, name: "Ven", jourAssignee: "M. Dubois" },
    { day: 20, name: "Sam", weAssignee: "S. Laurent" },
    { day: 21, name: "Dim", weAssignee: "C. Petit" },
    // Week 4
    { day: 22, name: "Lun", jourAssignee: "J. Dupont", nuitAssignee: "M. Dubois", tasksCount: 1 }, // today
    { day: 23, name: "Mar", jourAssignee: "S. Laurent" },
    { day: 24, name: "Mer", nuitAssignee: "P. Martin" },
    { day: 25, name: "Jeu", jourAssignee: "J. Dupont" },
    { day: 26, name: "Ven", jourAssignee: "S. Laurent", nuitAssignee: "M. Dubois" },
    { day: 27, name: "Sam", weAssignee: "J. Dupont" },
    { day: 28, name: "Dim", weAssignee: "S. Laurent" },
    // Week 5
    { day: 29, name: "Lun", jourAssignee: "C. Petit" },
    { day: 30, name: "Mar", jourAssignee: "S. Laurent", nuitAssignee: "J. Dupont" },
    { day: 31, name: "Mer", isEmpty: true }
  ]);

  // MODAL HANDLERS
  const [activeModalKey, setActiveModalKey] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDetails, setModalDetails] = useState<{ label: string; value: string }[]>([]);
  const [modalExports, setModalExports] = useState<string[]>([]);
  const [modalButtons, setModalButtons] = useState<string[]>([]);
  const [modalFormType, setModalFormType] = useState<"none" | "addStaff" | "editStaff" | "assignTask" | "editTask" | "assignGarde" | "addMedication">("none");

  // FORM INPUT TEMPS (Local state for forms rendered inside modals)
  const [tempStaffName, setTempStaffName] = useState("");
  const [tempStaffRole, setTempStaffRole] = useState<"Infirmier" | "Aide-soignant" | "Stagiaire">("Infirmier");
  const [tempStaffStatus, setTempStaffStatus] = useState<"Présent" | "Absent" | "Congé" | "En garde">("Présent");
  const [tempStaffDuty, setTempStaffDuty] = useState("");

  const [tempTaskName, setTempTaskName] = useState("");
  const [tempTaskStaff, setTempTaskStaff] = useState("Sophie Laurent");
  const [tempTaskPriority, setTempTaskPriority] = useState<"URGENT" | "NORMAL" | "BASSE">("NORMAL");
  const [tempTaskType, setTempTaskType] = useState("Jour (8h-20h)");
  const [tempTaskDetails, setTempTaskDetails] = useState("");

  const [tempGardeStaff, setTempGardeStaff] = useState("Sophie Laurent");
  const [tempGardeDate, setTempGardeDate] = useState("2026-06-23");
  const [tempGardeType, setTempGardeType] = useState("Jour (8h-20h)");

  // EXAMS STATE TABLE
  const [examsArray, setExamsArray] = useState([
    { id: "e1", date: "22/06/2026", title: "NFS", result: "—", status: "En attente" },
    { id: "e2", date: "22/06/2026", title: "CRP", result: "—", status: "En attente" },
    { id: "e3", date: "20/06/2026", title: "Radiographie", result: "Normale", status: "Validé" }
  ]);

  // UTILITY: Open a standard descriptive modal
  const triggerModalDescriptive = (
    title: string,
    details: { label: string; value: string }[],
    exportsArr: string[] = [],
    buttonsArr: string[] = []
  ) => {
    setModalFormType("none");
    setModalTitle(title);
    setModalDetails(details);
    setModalExports(exportsArr);
    setModalButtons(buttonsArr);
    setActiveModalKey("custom");
  };

  const handleCloseModal = () => {
    setActiveModalKey(null);
  };

  // ACTIONS EXECUTION
  const handleAddNewStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = (staffList.length + 1).toString();
    const newMember: StaffMember = {
      id: newId,
      name: tempStaffName || "Nouveau Membre",
      role: tempStaffRole,
      status: tempStaffStatus,
      guardsCount: "0",
      duty: tempStaffDuty || "—"
    };
    setStaffList([...staffList, newMember]);
    handleCloseModal();
    alert(`✅ Membre ${newMember.name} ajouté avec succès !`);
  };

  const handleAssignTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `task-${tasksList.length + 1}`;
    const newTask: AssignedTask = {
      id: newId,
      title: tempTaskName || "Tâche générique",
      priority: tempTaskPriority,
      staffName: tempTaskStaff,
      schedule: `23/06 (${tempTaskType.includes("Nuit") ? "Nuit" : "Jour"})`,
      status: "En cours"
    };
    setTasksList([newTask, ...tasksList]);
    handleCloseModal();
    alert(`✅ Tâche "${newTask.title}" assignée avec succès à ${newTask.staffName} !`);
  };

  const handleAssignGardeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateObj = new Date(tempGardeDate);
    const targetDayNumber = dateObj.getDate() || 23;
    setGardesCalendar(
      gardesCalendar.map(item => {
        if (item.day === targetDayNumber && !item.isEmpty) {
          const formattedName = tempGardeStaff.split(" ")[1] 
            ? `${tempGardeStaff.split(" ")[0][0]}. ${tempGardeStaff.split(" ")[1]}` 
            : tempGardeStaff;
          if (tempGardeType.includes("Nuit")) {
            return { ...item, nuitAssignee: `${formattedName} (N)` };
          } else if (tempGardeType.includes("Week-end")) {
            return { ...item, weAssignee: `${formattedName} (WE)` };
          } else {
            return { ...item, jourAssignee: `${formattedName} (J)` };
          }
        }
        return item;
      })
    );
    handleCloseModal();
    alert(`✅ Garde assignée avec succès pour le jour ${targetDayNumber} Juin à ${tempGardeStaff} !`);
  };

  const handleAddMedicationInline = () => {
    if (!newMedName) {
      alert("Veuillez saisir le nom du médicament");
      return;
    }
    const newId = (prescriptionsList.length + 1).toString();
    const newDrug: CustomPrescription = {
      id: newId,
      name: newMedName,
      dosage: newMedDosage || "1 cp",
      duration: newMedDuration || "5 jours"
    };
    setPrescriptionsList([...prescriptionsList, newDrug]);
    setNewMedName("");
    setNewMedDosage("");
    setNewMedDuration("");
    alert(`💊 ${newDrug.name} ajouté à la prescription en cours.`);
  };

  const handleDeleteMedication = (id: string, name: string) => {
    if (confirm(`Voulez-vous supprimer ${name} de la prescription ?`)) {
      setPrescriptionsList(prescriptionsList.filter(item => item.id !== id));
    }
  };

  return (
    <div className="maquette-container max-w-[1500px] w-full mx-auto px-4 py-6 bg-[#f4f7fa] min-h-screen text-[#333333] font-sans antialiased">
      
      {/* LOCAL STYLES SHEET FOR ABSOLUTE DESIGN REPLICATION */}
      <style>{`
        .header {
          background: #0b2a4a;
          color: white;
          border-radius: 16px 16px 0 0;
        }
        .header-right .doctor {
          background: #1e3f61;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .header-right .doctor:hover {
          background: #2a507a;
        }
        .patient-banner {
          background: #f0f6fe;
          border-bottom: 1px solid #d9e3ed;
        }
        .patient-banner .name:hover {
          background: #dce6f0;
        }
        .nav-tabs {
          border-bottom: 2px solid #e6edf5;
        }
        .nav-tab {
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
        }
        .nav-tab:hover {
          background: #f5f9ff;
          color: #0b2a4a;
        }
        .nav-tab.active {
          border-bottom-color: #0b6b9e;
          color: #0b2a4a;
          background: #f5f9ff;
        }
        .card {
          background: #f9fcff;
          border-radius: 14px;
          border: 1px solid #e6edf5;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .card-title {
          transition: all 0.2s;
        }
        .card-title:hover {
          background: #e6edf5;
        }
        .list-item {
          border-bottom: 1px dashed #dce6f0;
          transition: all 0.15s;
        }
        .list-item:hover {
          background: #eef4fa;
        }
        .badge-chef { background: #0b2a4a; color: white; }
        .badge-infirmier { background: #d4e2f0; color: #0b2a4a; }
        .badge-aide { background: #fef3d7; color: #9e7200; }
        .badge-stagiaire { background: #e3eff8; color: #0b6b9e; }

        .alert-badge {
          background: #fce8e6;
          color: #b13e3e;
          transition: all 0.2s;
        }
        .alert-badge:hover {
          background: #f5d0cc;
          transform: scale(1.02);
        }
        .table-mini th {
          border-bottom: 2px solid #cddbe9;
        }
        .table-mini td {
          border-bottom: 1px solid #e6edf5;
        }
        .table-mini tr {
          transition: all 0.15s;
        }
        .table-mini tr:hover {
          background: #f0f6fe;
        }
        .status-badge {
          font-weight: 600;
        }
        .status-present { background: #dff0e6; color: #1d6b4a; }
        .status-absent { background: #fce8e6; color: #b13e3e; }
        .status-conge { background: #fef3d7; color: #9e7200; }
        .status-garde { background: #d4e2f0; color: #0b2a4a; }
        .status-dispo { background: #e3eff8; color: #0b6b9e; }
        .status-enattente { background: #fef3d7; color: #9e7200; }
        .status-valide { background: #dff0e6; color: #1d6b4a; }

        .garde-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
        }
        .garde-day {
          background: #f5f9ff;
          border: 1px solid #dce6f0;
          min-height: 95px;
          transition: all 0.15s;
        }
        .garde-day:hover {
          background: #e3eff8;
          border-color: #0b6b9e;
          transform: scale(1.02);
          z-index: 2;
        }
        .garde-personne.jour { background: #0b6b9e; color: white; }
        .garde-personne.nuit { background: #0b2a4a; color: white; }
        .garde-personne.weekend { background: #b13e3e; color: white; }
        .garde-personne.remplacement { background: #d4a017; color: white; }

        .task-item {
          border: 1px solid #dce6f0;
          transition: all 0.15s;
        }
        .task-item:hover {
          background: #f5f9ff;
          border-color: #0b6b9e;
        }
        .priority-urgent { background: #fce8e6; color: #b13e3e; }
        .priority-normal { background: #dff0e6; color: #1d6b4a; }
        .priority-basse { background: #eef2f7; color: #6f8aa5; }

        .synthese-block {
          background: #eef6fb;
          border-left: 4px solid #0b6b9e;
          transition: all 0.2s;
        }
        .synthese-block:hover {
          background: #e2eef9;
        }
        .sidebar {
          background: #f7faff;
          border: 1px solid #e6edf5;
        }
        .sidebar-item {
          transition: all 0.15s;
        }
        .sidebar-item:hover {
          background: #e3eff8;
        }
        .modal-overlay {
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
        }
        @media (max-width: 1024px) {
          .garde-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        @media (max-width: 640px) {
          .garde-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>

      <div className="maquette bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
        
        {/* ===== HEADER ===== */}
        <div className="header p-4 flex flex-wrap justify-between items-center gap-3">
          <div className="header-left flex items-center gap-3">
            <i className="fas fa-hospital text-2xl text-[#5fc1e0]"></i>
            <h2 className="font-semibold text-lg tracking-tight">Clinique Centrale MédiSahel</h2>
          </div>
          <div className="header-right flex flex-wrap items-center gap-4 text-xs">
            {/* Active Doctor Button */}
            <span 
              className="doctor px-3 py-1.5 rounded-full flex items-center gap-2 cursor-pointer text-white font-medium"
              onClick={() => triggerModalDescriptive(
                "Profil Praticien",
                [
                  { label: "Nom Praticien", value: currentUser.name || "Dr. Martin" },
                  { label: "Rôle ERP", value: currentUser.role },
                  { label: "Clinique Active", value: "MédiSahel Bamako" },
                  { label: "Habilitations", value: "Consultations DMG, DME, Plan Directeur de Soins" }
                ],
                ["PDF"]
              )}
            >
              <i className="fas fa-user-md text-sky-400"></i> {currentUser.name || "Dr. Martin"} (Praticien)
            </span>
            <span className="text-slate-300 font-medium font-mono">
              <i className="fas fa-calendar-alt text-slate-400 mr-1.5"></i> 22 Juin 2026
            </span>
            <span 
              className="logout text-slate-300 hover:text-white transition-all cursor-pointer font-medium"
              onClick={() => triggerModalDescriptive(
                "Déconnexion Requise",
                [{ label: "Action recommandée", value: "Veuillez fermer votre navigateur ou vous déconnecter du portail global." }],
                [],
                ["Annuler", "Fermer la session"]
              )}
            >
              <i className="fas fa-sign-out-alt mr-1"></i> Déconnexion
            </span>
          </div>
        </div>

        {/* ===== PATIENT BANNER WITH CHANGER ===== */}
        <div className="patient-banner px-5 py-3 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            {/* Patient selector to seamlessly bridge custom data with props */}
            <div className="relative">
              <span 
                className="name font-bold text-base text-[#0b2a4a] hover:bg-slate-200/60 px-2 py-1 rounded-md cursor-pointer transition-all flex items-center gap-1.5"
                onClick={() => triggerModalDescriptive(
                  "Dossier Patient Actif",
                  [
                    { label: "Nom complet", value: `${activePatient.lastName} ${activePatient.firstName}` },
                    { label: "Identifiant National", value: activePatient.nationalId },
                    { label: "Date de Naissance", value: activePatient.dateOfBirth },
                    { label: "Sexe / Genre", value: activePatient.gender },
                    { label: "N° Téléphone", value: activePatient.phone || "—" },
                    { label: "Allergies Médicales", value: activePatient.allergies || "Aucune" },
                    { label: "Quartier / Adresse", value: activePatient.address || "Bamako" },
                    { label: "Groupe Sanguin", value: activePatient.bloodType || "Inconnu" }
                  ],
                  ["PDF"]
                )}
              >
                <i className="fas fa-id-card text-sky-700"></i> {activePatient.lastName} {activePatient.firstName}
              </span>
            </div>
            <span className="badge bg-sky-200/60 px-3 py-0.5 rounded-full text-[11px] font-bold text-[#0b2a4a]">
              N° {activePatient.nationalId}
            </span>
          </div>

          {/* Quick patient pick switcher */}
          <div className="flex items-center gap-3 text-xs">
            {patients.length > 0 && (
              <div className="flex items-center gap-1.5 bg-white/70 border border-slate-300 rounded-lg px-2.5 py-1">
                <label className="text-slate-500 font-medium">Changer de patient :</label>
                <select 
                  className="bg-transparent border-none font-bold text-slate-800 focus:outline-none cursor-pointer"
                  value={activePatient.id}
                  onChange={(e) => {
                    const found = patients.find(p => p.id === e.target.value);
                    if (found) setActivePatient(found);
                  }}
                >
                  <option value="demo-dupont">Marie DUPONT (Patient Démo)</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.lastName} {p.firstName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <span 
              className="info-item flex items-center gap-1.5 text-slate-700 hover:bg-slate-200/60 px-2 py-1 rounded-md cursor-pointer transition-all"
              onClick={() => triggerModalDescriptive(
                "Informations Cliniques",
                [
                  { label: "Date de Naissance", value: activePatient.dateOfBirth },
                  { label: "Sexe", value: activePatient.gender },
                  { label: "Adresse", value: activePatient.address || "Mali" }
                ]
              )}
            >
              <i className="fas fa-calendar text-[#3d7ea6]"></i> {activePatient.gender === "F" ? "Femme" : "Homme"}
            </span>

            <span 
              className="info-item flex items-center gap-1.5 text-slate-700 hover:bg-slate-200/60 px-2 py-1 rounded-md cursor-pointer transition-all"
              onClick={() => triggerModalDescriptive(
                "Médecin Traitant Référent",
                [
                  { label: "Médecin Traitant", value: "Dr. Ibrahim TOURÉ" },
                  { label: "Spécialité", value: "Médecine Générale" }
                ]
              )}
            >
              <i className="fas fa-user-md text-[#3d7ea6]"></i> Dr. Touré (MT)
            </span>

            <span 
              className="info-item flex items-center gap-1.5 text-slate-700 hover:bg-slate-200/60 px-2 py-1 rounded-md cursor-pointer transition-all"
              onClick={() => triggerModalDescriptive(
                "Dernier Passage Clinique",
                [
                  { label: "Dernière Consultation", value: "12/05/2026 à Médisahel" },
                  { label: "Contrôle HTA", value: "Réalisé et stabilisé" }
                ]
              )}
            >
              <i className="fas fa-clock text-[#3d7ea6]"></i> Dernier dossier : 12/05/2026
            </span>
          </div>
        </div>

        {/* ===== NAVIGATION TABS ===== */}
        <div className="nav-tabs flex flex-wrap gap-1 px-4 bg-white">
          <button 
            className={`nav-tab px-4 py-3 text-xs font-semibold flex items-center gap-1.5 ${activeTab === "resume" ? "active" : "text-slate-600"}`}
            onClick={() => setActiveTab("resume")}
          >
            <i className="fas fa-clipboard-list text-sm"></i> Résumé
          </button>
          <button 
            className={`nav-tab px-4 py-3 text-xs font-semibold flex items-center gap-1.5 ${activeTab === "consultation" ? "active" : "text-slate-600"}`}
            onClick={() => setActiveTab("consultation")}
          >
            <i className="fas fa-notes-medical text-sm"></i> Consultation
          </button>
          <button 
            className={`nav-tab px-4 py-3 text-xs font-semibold flex items-center gap-1.5 ${activeTab === "examens" ? "active" : "text-slate-600"}`}
            onClick={() => setActiveTab("examens")}
          >
            <i className="fas fa-flask text-sm"></i> Examens
          </button>
          <button 
            className={`nav-tab px-4 py-3 text-xs font-semibold flex items-center gap-1.5 ${activeTab === "prescriptions" ? "active" : "text-slate-600"}`}
            onClick={() => setActiveTab("prescriptions")}
          >
            <i className="fas fa-prescription text-sm"></i> Prescriptions
          </button>
          <button 
            className={`nav-tab px-4 py-3 text-xs font-semibold flex items-center gap-1.5 ${activeTab === "staff" ? "active" : "text-slate-600"}`}
            onClick={() => setActiveTab("staff")}
          >
            <i className="fas fa-users text-sm"></i> Staff & Gardes
          </button>
          <button 
            className={`nav-tab px-4 py-3 text-xs font-semibold flex items-center gap-1.5 ${activeTab === "documents" ? "active" : "text-slate-600"}`}
            onClick={() => setActiveTab("documents")}
          >
            <i className="fas fa-file-medical text-sm"></i> Documents
          </button>
          <button 
            className={`nav-tab px-4 py-3 text-xs font-semibold flex items-center gap-1.5 ${activeTab === "workflow" ? "active" : "text-amber-800 border-amber-200"}`}
            onClick={() => setActiveTab("workflow")}
          >
            <i className="fas fa-route text-sm text-amber-600 animate-pulse"></i> Workflow Officiel (Parcours)
          </button>
        </div>

        {/* ========================================================= */}
        {/* ===== TAB CONTENTS ===== */}
        <div className="tab-contents p-6 bg-white min-h-[480px]">

          {/* ---- RÉSUMÉ ---- */}
          {activeTab === "resume" && (
            <div className="sidebar-wrapper grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade">
              
              {/* Main summary cards */}
              <div className="md:col-span-3 flex flex-col gap-5">
                
                <div className="card p-5">
                  <div 
                    className="card-title font-semibold text-[15px] text-[#0b2a4a] mb-4 flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1.5 rounded-lg w-fit"
                    onClick={() => triggerModalDescriptive(
                      "Résumé Clinique Global",
                      [
                        { label: "Allergies identifiées", value: activePatient.allergies || "Penicilline" },
                        { label: "Dernier Antécédent", value: "HTA stabilisée sous traitement, Cholécystectomie en 2020" },
                        { label: "Plan actuel de soins", value: "Amlodipine 5mg DIE, Atorvastatine 20mg DIE" }
                      ],
                      ["PDF"]
                    )}
                  >
                    <i className="fas fa-notes-medical text-[#2a7da8]"></i> Résumé clinique de consultation
                  </div>
                  
                  {/* Urgent allergy status badge */}
                  <div>
                    <span 
                      className="alert-badge font-semibold text-xs px-3.5 py-1 rounded-full cursor-pointer inline-flex items-center gap-2"
                      onClick={() => triggerModalDescriptive(
                        "Alerte Allergies Majeures",
                        [{ label: "Alerte Déclarée", value: activePatient.allergies || "Allergie pénicilline" }, { label: "Gravité", value: "Critique - Choc anaphylactique potentiel" }]
                      )}
                    >
                      <i className="fas fa-exclamation-triangle text-rose-600"></i> {activePatient.allergies || "Allergie pénicilline"}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-col gap-2.5">
                    <div 
                      className="list-item py-1.5 px-2 text-sm flex items-center gap-2 cursor-pointer rounded-lg"
                      onClick={() => triggerModalDescriptive(
                        "Historique Médical & Antécédents",
                        [
                          { label: "Hypertension Artérielle", value: "Déclarée en 2018. Contrôlée." },
                          { label: "Post-Chirurgie", value: "Cholécystectomie réalisée en 2020. Pas de séquelles." }
                        ]
                      )}
                    >
                      <span className="label font-semibold text-[#1e3f61] min-w-[110px]">Antécédents :</span>
                      <span className="text-slate-600 font-medium">HTA (2018), Cholécystectomie (2020)</span>
                    </div>

                    <div 
                      className="list-item py-1.5 px-2 text-sm flex items-center gap-2 cursor-pointer rounded-lg"
                      onClick={() => triggerModalDescriptive(
                        "Traitements Courants Actifs",
                        [
                          { label: "Amlodipine 5mg", value: "1 comprimé chaque matin" },
                          { label: "Atorvastatine 20mg", value: "1 comprimé chaque soir au coucher" }
                        ]
                      )}
                    >
                      <span className="label font-semibold text-[#1e3f61] min-w-[110px]">Traitements :</span>
                      <span className="text-slate-600 font-medium">Amlodipine 5mg, Atorvastatine 20mg</span>
                    </div>

                    <div 
                      className="list-item py-1.5 px-2 text-sm flex items-center gap-2 cursor-pointer rounded-lg"
                      onClick={() => triggerModalDescriptive(
                        "Dernier Paramètres Vitaux Enregistrés",
                        [
                          { label: "Tension Artérielle", value: "135/85 mmHg" },
                          { label: "Poids Patient", value: `${poids} kg` },
                          { label: "Fréquence Cardiaque", value: "78 bpm" }
                        ]
                      )}
                    >
                      <span className="label font-semibold text-[#1e3f61] min-w-[110px]">Derniers params :</span>
                      <span className="text-slate-600 font-medium">TA: {taMax} · Poids: {poids} kg · Temp: {temp}°C</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div 
                    className="card p-5 cursor-pointer hover:border-sky-500 transition-colors"
                    onClick={() => triggerModalDescriptive(
                      "Suivi Constantes Physiologiques",
                      [
                        { label: "Tension Artérielle Max/Min", value: "135/85 mmHg (Correct)" },
                        { label: "Fréquence Cardiaque", value: "78 battements par minute (Sinusal)" },
                        { label: "Température corporelle", value: "37.2 °C (Apyrétique)" }
                      ],
                      ["PDF"]
                    )}
                  >
                    <div className="card-title font-semibold text-sm text-[#0b2a4a] mb-2.5 flex items-center gap-2">
                      <i className="fas fa-heartbeat text-red-500"></i> Constantes Vitales
                    </div>
                    <div className="text-xs text-slate-600 space-y-1 font-mono">
                      <div>TA: <strong className="text-slate-800">{taMax} mmHg</strong></div>
                      <div>FC: <strong className="text-slate-800">{fc} bpm</strong></div>
                      <div>Temp: <strong className="text-slate-800">{temp}°C</strong></div>
                    </div>
                  </div>

                  <div 
                    className="card p-5 cursor-pointer hover:border-sky-500 transition-colors"
                    onClick={() => triggerModalDescriptive(
                      "Planification Consultations futures",
                      [
                        { label: "Motif", value: "Contrôle cardiologique et renouvellement HTA" },
                        { label: "Date fixée", value: "15 Juillet 2026 à 09:30" },
                        { label: "Praticien désigné", value: "Cabinet de Médecine Générale" }
                      ]
                    )}
                  >
                    <div className="card-title font-semibold text-sm text-[#0b2a4a] mb-2.5 flex items-center gap-2">
                      <i className="fas fa-calendar-check text-green-600"></i> Prochain Rendez-vous
                    </div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="font-semibold text-slate-800">Contrôle HTA stable</div>
                      <div className="font-mono text-[11px]">Le 15/07/2026 à la clinique</div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Sidebar items */}
              <div className="sidebar p-4 rounded-xl flex flex-col gap-1.5 h-fit">
                <div 
                  className="sidebar-item p-2.5 rounded-lg flex items-center gap-2.5 text-xs text-[#1e3f61] font-semibold cursor-pointer"
                  onClick={() => triggerModalDescriptive("Agenda de la clinique", [{ label: "Consultations programmées", value: "5 aujourd'hui" }])}
                >
                  <i className="fas fa-calendar-alt text-[#2a7da8]"></i> Agenda Cabinet
                </div>
                <div 
                  className="sidebar-item p-2.5 rounded-lg flex items-center gap-2.5 text-xs text-[#1e3f61] font-semibold cursor-pointer"
                  onClick={() => triggerModalDescriptive("Dossiers Cliniques", [{ label: "Dossiers de la clinique", value: "1 245 au total" }])}
                >
                  <i className="fas fa-folder-open text-[#2a7da8]"></i> Tous les Dossiers
                </div>
                <div 
                  className="sidebar-item p-2.5 rounded-lg flex items-center gap-2.5 text-xs text-[#1e3f61] font-semibold cursor-pointer"
                  onClick={() => triggerModalDescriptive("Rapports & Statistiques", [{ label: "Taux d'occupation", value: "85%" }, { label: "Passages DMG", value: "127 ce mois" }])}
                >
                  <i className="fas fa-chart-bar text-[#2a7da8]"></i> Statistiques Clinique
                </div>
                <div 
                  className="sidebar-item p-2.5 rounded-lg flex items-center gap-2.5 text-xs text-[#1e3f61] font-semibold cursor-pointer"
                  onClick={() => {
                    setTempStaffName("");
                    setTempStaffRole("Infirmier");
                    setTempStaffStatus("Présent");
                    setTempStaffDuty("");
                    setModalFormType("addStaff");
                    setModalTitle("Gestion du personnel médical - Ajouter un membre");
                    setActiveModalKey("addStaff");
                  }}
                >
                  <i className="fas fa-users text-[#2a7da8]"></i> Gérer le Staff <span className="ml-auto bg-[#b13e3e] text-white rounded-full text-[10px] px-2 py-0.5">{staffList.length}</span>
                </div>
                <div 
                  className="sidebar-item p-2.5 rounded-lg flex items-center gap-2.5 text-xs text-[#1e3f61] font-semibold cursor-pointer"
                  onClick={() => setActiveTab("staff")}
                >
                  <i className="fas fa-calendar-alt text-[#2a7da8]"></i> Planning Gardes
                </div>
              </div>

            </div>
          )}

          {/* ---- CONSULTATION ---- */}
          {activeTab === "consultation" && (
            <div className="animate-fade flex flex-col gap-5">
              <h3 className="text-base font-bold text-[#0b2a4a] flex items-center gap-2">
                <i className="fas fa-pen-alt text-sky-600"></i> Nouvelle consultation clinique · {activePatient.lastName} {activePatient.firstName}
              </h3>
              
              <div className="card p-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">Motif de consultation</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-slate-350 rounded-lg text-sm bg-white" 
                    value={motif}
                    onChange={(e) => setMotif(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">Anamnèse / Interrogatoire clinique</label>
                  <textarea 
                    className="w-full px-3 py-2 border border-slate-350 rounded-lg text-sm bg-white" 
                    rows={3}
                    value={anamnese}
                    onChange={(e) => setAnamnèse(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">Tension Artérielle (mmHg)</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-slate-350 rounded-lg text-sm font-mono text-center" 
                      value={taMax} 
                      onChange={(e) => setTaMax(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">Poids corporel (kg)</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-slate-350 rounded-lg text-sm font-mono text-center" 
                      value={poids} 
                      onChange={(e) => setPoids(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">Température (°C)</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-slate-350 rounded-lg text-sm font-mono text-center" 
                      value={temp} 
                      onChange={(e) => setTemp(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">Pulsations (bpm)</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-slate-350 rounded-lg text-sm font-mono text-center" 
                      value={fc} 
                      onChange={(e) => setFc(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">Examen clinique détaillé</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-slate-350 rounded-lg text-sm" 
                    value={examenClinique}
                    onChange={(e) => setExamenClinique(e.target.value)}
                  />
                </div>

                <div className="btn-group pt-4 border-t flex flex-wrap gap-2.5">
                  <button 
                    className="btn btn-primary shadow-md"
                    onClick={() => {
                      alert("✅ Consultation enregistrée avec succès dans le DME !");
                      triggerModalDescriptive(
                        "Statut Consultation",
                        [
                          { label: "Patient", value: `${activePatient.lastName} ${activePatient.firstName}` },
                          { label: "Diagnostic d'Admission", value: examenClinique },
                          { label: "Motif Consigné", value: motif },
                          { label: "Tension vitale", value: `${taMax} mmHg` },
                          { label: "Date d'enregistrement", value: new Date().toLocaleTimeString() }
                        ]
                      );
                    }}
                  >
                    <i className="fas fa-save mr-1"></i> Enregistrer
                  </button>
                  <button 
                    className="btn btn-outline"
                    onClick={() => alert("📄 Génération de l'export de consultation en cours...")}
                  >
                    <i className="fas fa-file-pdf mr-1"></i> Export de synthèse PDF
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ---- EXAMENS ---- */}
          {activeTab === "examens" && (
            <div className="animate-fade flex flex-col gap-4">
              <div className="flex justify-between items-center gap-3 flex-wrap">
                <h3 className="text-base font-bold text-[#0b2a4a] flex items-center gap-2">
                  <i className="fas fa-flask text-sky-600"></i> Bilans Biologiques et Examens de Laboratoire
                </h3>
                <button 
                  className="btn btn-primary btn-sm rounded-lg"
                  onClick={() => {
                    const newExam = {
                      id: `e-${examsArray.length + 1}`,
                      date: "22/06/2026",
                      title: prompt("Saisir l'examen demandé (ex: NFS, Glycémie, Ionogramme) :") || "Examen type",
                      result: "—",
                      status: "En attente"
                    };
                    setExamsArray([...examsArray, newExam]);
                  }}
                >
                  <i className="fas fa-plus mr-1"></i> Demander un Examen
                </button>
              </div>

              <div className="card overflow-x-auto">
                <table className="table-mini w-full min-w-[500px] text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-800 text-left">
                      <th className="p-3">Date de demande</th>
                      <th className="p-3">Dénomination de l'examen</th>
                      <th className="p-3">Résultat du rapport</th>
                      <th className="p-3">Statut Dossier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examsArray.map(exam => (
                      <tr 
                        key={exam.id} 
                        className="hover:bg-slate-50 cursor-pointer"
                        onClick={() => triggerModalDescriptive(
                          `Détail d'examen - ${exam.title}`,
                          [
                            { label: "Désignation", value: exam.title },
                            { label: "Statut Actuel", value: exam.status },
                            { label: "Valeurs / Conclusions", value: exam.result },
                            { label: "Date demandée", value: exam.date }
                          ],
                          ["PDF"]
                        )}
                      >
                        <td className="p-3 text-slate-500 font-mono text-xs">{exam.date}</td>
                        <td className="p-3 font-semibold text-slate-800">{exam.title}</td>
                        <td className="p-3 text-slate-600 italic">{exam.result}</td>
                        <td className="p-3">
                          <span className={`status-badge px-2.5 py-0.5 rounded-full text-xs font-semibold ${exam.status === "Validé" ? "status-valide" : "status-enattente"}`}>
                            {exam.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ---- PRESCRIPTIONS ---- */}
          {activeTab === "prescriptions" && (
            <div className="animate-fade flex flex-col gap-5">
              <h3 className="text-base font-bold text-[#0b2a4a] flex items-center gap-2">
                <i className="fas fa-prescription text-sky-600"></i> Ordonnance de prescription médicale en cours
              </h3>

              <div className="card p-5 flex flex-col gap-4">
                {/* Medication addition form */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex flex-col gap-1.5 col-span-2">
                    <label className="text-[11px] font-bold text-slate-600">Posologie & Médicament DCI</label>
                    <input 
                      type="text" 
                      placeholder="Doliprane, Amoxicilline..."
                      className="px-3 py-1.5 text-sm border rounded-lg bg-white"
                      value={newMedName}
                      onChange={(e) => setNewMedName(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-600">Fréquence des prises</label>
                    <input 
                      type="text" 
                      placeholder="1 comp x3 par jour"
                      className="px-3 py-1.5 text-sm border rounded-lg bg-white"
                      value={newMedDosage}
                      onChange={(e) => setNewMedDosage(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-600">Durée prescription</label>
                    <input 
                      type="text" 
                      placeholder="7 jours"
                      className="px-3 py-1.5 text-sm border rounded-lg bg-white"
                      value={newMedDuration}
                      onChange={(e) => setNewMedDuration(e.target.value)}
                    />
                  </div>
                  <div className="col-span-full flex justify-end">
                    <button 
                      className="btn btn-primary btn-sm flex items-center gap-1"
                      onClick={handleAddMedicationInline}
                    >
                      <i className="fas fa-plus"></i> Ajouter l'article à l'ordonnance
                    </button>
                  </div>
                </div>

                {/* Interactive medicine lists */}
                <div className="flex flex-col gap-2 mt-2">
                  {prescriptionsList.map(drug => (
                    <div 
                      key={drug.id} 
                      className="prescription-item p-3 border border-slate-200 rounded-xl hover:bg-slate-50/80 cursor-pointer flex justify-between items-center"
                      onClick={() => triggerModalDescriptive(
                        `Posologie - ${drug.name}`,
                        [
                          { label: "Nom Prise", value: drug.name },
                          { label: "Instructions de prise", value: drug.dosage },
                          { label: "Durée spécifiée", value: drug.duration }
                        ]
                      )}
                    >
                      <div className="med-info text-xs md:text-sm font-medium text-slate-800 flex items-center gap-2">
                        <i className="fas fa-check-circle text-emerald-600"></i>
                        <span>
                          <strong>{drug.name}</strong> · {drug.dosage} · {drug.duration}
                        </span>
                      </div>
                      <div className="prescription-actions flex gap-2 text-slate-500 hover:text-rose-600">
                        <button 
                          className="p-1 hover:bg-rose-100 rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMedication(drug.id, drug.name);
                          }}
                        >
                          <i className="fas fa-trash-alt text-xs"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="btn-group pt-4 border-t flex flex-wrap gap-2">
                  <button 
                    className="btn btn-success font-semibold px-5 py-2 hover:bg-emerald-700"
                    onClick={() => {
                      alert("✅ Ordonnance signée numériquement et injectée vers l'officine de pharmacie !");
                      triggerModalDescriptive(
                        "Ordonnance Clôturée",
                        [
                          { label: "Statut d'Officine", value: "Actif - Pris en charge par FEFO" },
                          { label: "Rapport pharmacie", value: `${prescriptionsList.length} articles prescrits.` }
                        ]
                      );
                    }}
                  >
                    <i className="fas fa-save mr-1.5"></i> Signer & Transmettre
                  </button>
                  <button 
                    className="btn btn-outline px-4 py-2"
                    onClick={() => alert("📄 Ordonnance au format PDF d'imprimerie en cours de génération...")}
                  >
                    <i className="fas fa-file-pdf mr-1.5"></i> Exporter PDF
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ===== STAFF & GARDES (COMPLET AVEC TÂCHES) ===== */}
          {activeTab === "staff" && (
            <div className="animate-fade flex flex-col gap-6">
              
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-[#0b2a4a] flex items-center gap-2">
                  <i className="fas fa-users text-sky-600"></i> Gestion et Organigramme du Personnel Médical
                </h3>
                <p className="text-xs text-slate-500 font-medium">Cabinet Médecine Générale · Gardes d'astreinte active et affectation des soins cliniques</p>
              </div>

              {/* Organized Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div 
                  className="card p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-sky-500 transition-colors"
                  onClick={() => triggerModalDescriptive(
                    "Fiche Personnel - Infirmiers",
                    [
                      { label: "Postes affectés", value: "6 Infirmiers Diplômés d'État" },
                      { label: "Astreinte active", value: "Sophie Laurent, Jean Dupont" }
                    ]
                  )}
                >
                  <span className="text-3xl text-sky-600"><i className="fas fa-user-nurse"></i></span>
                  <span className="text-xl font-bold text-[#0b2a4a] mt-1">6</span>
                  <span className="text-slate-500 font-semibold text-[11px] mt-0.5">Infirmiers</span>
                </div>

                <div 
                  className="card p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-yellow-600 transition-colors"
                  onClick={() => triggerModalDescriptive(
                    "Fiche Personnel - Aides-soignants",
                    [
                      { label: "Effectif", value: "4 Aides en service" },
                      { label: "Statut astreinte", value: "Marie Dubois (Congé), Salif Coulibaly (Présent)" }
                    ]
                  )}
                >
                  <span className="text-3xl text-amber-500"><i className="fas fa-hand-holding-heart"></i></span>
                  <span className="text-xl font-bold text-[#0b2a4a] mt-1">4</span>
                  <span className="text-slate-500 font-semibold text-[11px] mt-0.5">Aides-soignants</span>
                </div>

                <div 
                  className="card p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-sky-500 transition-colors"
                  onClick={() => triggerModalDescriptive(
                    "Fiche Personnel - Stagiaires de formation",
                    [
                      { label: "Rôle", value: "Apprentissage clinique encadré" },
                      { label: "Membres", value: "Paul Martin (Présent), Amadou Diallo (Présent)" }
                    ]
                  )}
                >
                  <span className="text-3xl text-indigo-500"><i className="fas fa-graduation-cap"></i></span>
                  <span className="text-xl font-bold text-[#0b2a4a] mt-1">2</span>
                  <span className="text-slate-500 font-semibold text-[11px] mt-0.5">Stagiaires</span>
                </div>

                <div 
                  className="card p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#0b2a4a] transition-colors"
                  onClick={() => triggerModalDescriptive(
                    "Statistiques d'astreintes globales",
                    [
                      { label: "Gardes cumulées", value: "28 affectations ce mois" },
                      { label: "Heures supplémentaires", value: "Calculées automatiquement" }
                    ]
                  )}
                >
                  <span className="text-3xl text-emerald-600"><i className="fas fa-clock"></i></span>
                  <span className="text-xl font-bold text-[#0b2a4a] mt-1">28</span>
                  <span className="text-slate-500 font-semibold text-[11px] mt-0.5">Gardes Cliniques</span>
                </div>
              </div>

              {/* PERSONNEL EN POSTE GRID LIST */}
              <div className="card p-5">
                <div className="card-title font-semibold text-[15px] text-[#0b2a4a] mb-4 flex items-center justify-between">
                  <span><i className="fas fa-list text-sky-600 mr-2"></i> Médecins & Personnel d'Équipe en Poste</span>
                  <span 
                    className="text-xs font-semibold text-sky-700 hover:underline cursor-pointer"
                    onClick={() => triggerModalDescriptive(
                      "Équipe active au complet",
                      staffList.map(member => ({ label: member.name, value: `${member.role} (${member.status})` }))
                    )}
                  >
                    Voir tout le personnel <i className="fas fa-chevron-right ml-0.5"></i>
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="table-mini w-full text-xs md:text-sm text-left">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="p-2.5">Nom d'Usage</th>
                        <th className="p-2.5">Rôle / Service</th>
                        <th className="p-2.5">Disponibilité</th>
                        <th className="p-2.5">Affectation Mensuelle</th>
                        <th className="p-2.5">Spécialité / Tâche assignée</th>
                        <th className="p-2.5">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffList.map(staff => (
                        <tr 
                          key={staff.id} 
                          className="hover:bg-slate-50/70 cursor-pointer"
                          onClick={() => triggerModalDescriptive(
                            `Fiche Membre d'Équipe - ${staff.name}`,
                            [
                              { label: "Désignation complète", value: staff.name },
                              { label: "Rôle affecté", value: staff.role },
                              { label: "Disponibilité active", value: staff.status },
                              { label: "Cumul Mensuel", value: staff.guardsCount },
                              { label: "Secteur", value: staff.duty }
                            ]
                          )}
                        >
                          <td className="p-2.5"><strong>{staff.name}</strong></td>
                          <td className="p-2.5">
                            <span className={`badge-role text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${
                              staff.role === "Médecin Chef" ? "badge-chef" : 
                              staff.role === "Infirmier" ? "badge-infirmier" : 
                              staff.role === "Aide-soignant" ? "badge-aide" : "badge-stagiaire"
                            }`}>
                              {staff.role}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <span className={`status-badge text-[11px] px-2 py-0.5 rounded-full ${
                              staff.status === "Présent" ? "status-present" :
                              staff.status === "En garde" ? "status-garde" :
                              staff.status === "Congé" ? "status-conge" : "status-absent"
                            }`}>
                              {staff.status}
                            </span>
                          </td>
                          <td className="p-2.5 font-mono text-xs">{staff.guardsCount}</td>
                          <td className="p-2.5 font-medium text-slate-700">{staff.duty}</td>
                          <td className="p-2.5 text-slate-500">
                            <div className="flex gap-2">
                              <button 
                                className="p-1 hover:bg-slate-200 rounded"
                                title="Modifier"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTempStaffName(staff.name);
                                  setTempStaffRole(staff.role === "Médecin Chef" ? "Infirmier" : staff.role as any);
                                  setTempStaffStatus(staff.status);
                                  setTempStaffDuty(staff.duty);
                                  setModalFormType("editStaff");
                                  setModalTitle(`Modifier les configurations de : ${staff.name}`);
                                  setActiveModalKey("editStaff");
                                }}
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button 
                                className="p-1 hover:bg-sky-100 rounded text-sky-700" 
                                title="Tâches"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTempTaskStaff(staff.name);
                                  setTempTaskName("");
                                  setTempTaskDetails("");
                                  setModalFormType("assignTask");
                                  setModalTitle(`Assigner une tâche à : ${staff.name}`);
                                  setActiveModalKey("assignTask");
                                }}
                              >
                                <i className="fas fa-tasks"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button 
                    className="btn btn-primary btn-sm flex items-center gap-1.5"
                    onClick={() => {
                      setTempStaffName("");
                      setTempStaffRole("Infirmier");
                      setTempStaffStatus("Présent");
                      setTempStaffDuty("");
                      setModalFormType("addStaff");
                      setModalTitle("Gestion du personnel médical - Ajouter un membre");
                      setActiveModalKey("addStaff");
                    }}
                  >
                    <i className="fas fa-user-plus text-xs"></i> Recruter / Ajouter
                  </button>
                  <button 
                    className="btn btn-success btn-sm flex items-center gap-1.5"
                    onClick={() => {
                      setTempTaskStaff("Sophie Laurent");
                      setTempTaskName("");
                      setTempTaskDetails("");
                      setModalFormType("assignTask");
                      setModalTitle("Assignation d'une nouvelle tâche clinique");
                      setActiveModalKey("assignTask");
                    }}
                  >
                    <i className="fas fa-tasks text-xs"></i> Assigner Tâche
                  </button>
                  <button 
                    className="btn btn-warning btn-sm flex items-center gap-1.5"
                    onClick={() => {
                      setTempGardeStaff("Sophie Laurent");
                      setTempGardeDate("2026-06-23");
                      setTempGardeType("Jour (8h-20h)");
                      setModalFormType("assignGarde");
                      setModalTitle("Affectation d'un roulement de garde");
                      setActiveModalKey("assignGarde");
                    }}
                  >
                    <i className="fas fa-calendar-plus text-xs"></i> Assigner Garde Astreinte
                  </button>
                </div>
              </div>

              {/* TÂCHES EN COURS LIST */}
              <div className="card p-5">
                <div className="card-title font-semibold text-[15px] text-[#0b2a4a] mb-4 flex items-center justify-between">
                  <span><i className="fas fa-tasks mr-2 text-sky-600"></i> Plan Directeur de Soins (Affectations actives)</span>
                  <span 
                    className="text-xs text-slate-500 cursor-pointer"
                    onClick={() => triggerModalDescriptive(
                      "Journal des Soins Cliniques",
                      tasksList.map(t => ({ label: t.title, value: `${t.staffName} [${t.priority}]` }))
                    )}
                  >
                    Voir l'intégralité
                  </span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {tasksList.map(task => (
                    <div 
                      key={task.id} 
                      className="task-item p-3 border rounded-xl flex flex-wrap justify-between items-center gap-2"
                      onClick={() => triggerModalDescriptive(
                        `Affectation : ${task.title}`,
                        [
                          { label: "Soins désigné", value: task.title },
                          { label: "Exécuteur affecté", value: task.staffName },
                          { label: "Priorité relative", value: task.priority },
                          { label: "Planifié le", value: task.schedule },
                          { label: "Statut", value: task.status }
                        ]
                      )}
                    >
                      <div className="task-info flex items-center gap-3.5 flex-wrap">
                        <span className={`task-priority text-[9.5px] font-black px-2.5 py-0.5 rounded-full ${
                          task.priority === "URGENT" ? "priority-urgent" : 
                          task.priority === "NORMAL" ? "priority-normal" : "priority-basse"
                        }`}>
                          {task.priority}
                        </span>
                        <span>
                          <strong className="text-slate-800 text-sm">{task.title}</strong>
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {task.staffName} · {task.schedule}
                        </span>
                      </div>
                      <div className="task-actions flex items-center gap-2">
                        <button 
                          className="px-2 py-1 bg-slate-100 hover:bg-emerald-100 text-slate-500 hover:text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTasksList(tasksList.filter(t => t.id !== task.id));
                            alert(`✅ Soin "${task.title}" validé cliniquement !`);
                          }}
                        >
                          <i className="fas fa-check text-[11px]"></i> Traité
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PLANNING CALENADRIED Astreinte */}
              <div className="card p-5">
                <div className="card-title font-semibold text-[15px] text-[#0b2a4a] mb-5 flex justify-between items-center">
                  <span><i className="fas fa-calendar-alt text-sky-600 mr-2"></i> Planning Chronologique des Astreintes Active - Juin 2026</span>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <button className="p-1 border rounded hover:bg-slate-100"><i className="fas fa-chevron-left"></i></button>
                    <span>Mois de Juin 2026</span>
                    <button className="p-1 border rounded hover:bg-slate-100"><i className="fas fa-chevron-right"></i></button>
                  </div>
                </div>

                <div className="garde-grid">
                  {/* Generate Calendar cells based on Juni state */}
                  {gardesCalendar.map((cell, idx) => {
                    if (cell.isEmpty) {
                      return (
                        <div key={idx} className="garde-day vide rounded-xl p-2.5">
                          <span className="day-number font-black text-slate-400">{cell.day || "31"}</span>
                          <span className="day-name block text-[9px] text-[#999] uppercase font-bold">Mer</span>
                          <span className="text-[9px] block text-rose-800 font-bold mt-2">À pourvoir</span>
                        </div>
                      );
                    }
                    return (
                      <div 
                        key={idx} 
                        className={`garde-day rounded-xl p-2.5 ${cell.day === 22 ? "ring-2 ring-sky-500" : ""}`}
                        onClick={() => triggerModalDescriptive(
                          `Garde d'astreinte active du ${cell.day} Juin 2026`,
                          [
                            { label: "Journée", value: cell.jourAssignee || "Dr. Ibrahim TOURÉ (Par défaut)" },
                            { label: "Nuitée", value: cell.nuitAssignee || "Infirmier d'astreinte locale" },
                            { label: "Gardes week-end", value: cell.weAssignee || "—" },
                            { label: "Statut général", value: "Validé et affiché" }
                          ],
                          ["PDF"]
                        )}
                      >
                        <div className="flex justify-between items-center">
                          <span className="day-number text-[#0b2a4a] font-extrabold text-sm">{cell.day}</span>
                          <span className="day-name text-[9px] text-slate-400 font-bold uppercase">{cell.name}</span>
                        </div>
                        
                        <div className="flex flex-col gap-1 mt-2.5 text-[9.5px]">
                          {cell.jourAssignee && (
                            <span className="garde-personne jour block text-center rounded font-semibold truncate">
                              {cell.jourAssignee}
                            </span>
                          )}
                          {cell.nuitAssignee && (
                            <span className="garde-personne nuit block text-center rounded font-semibold truncate">
                              {cell.nuitAssignee}
                            </span>
                          )}
                          {cell.weAssignee && (
                            <span className="garde-personne weekend block text-center rounded font-semibold truncate">
                              {cell.weAssignee}
                            </span>
                          )}
                        </div>

                        {cell.tasksCount && (
                          <div className="badge-taches block text-center text-[7.5px] bg-[#eef2f7] py-0.5 rounded-full font-black text-[#1e3f61] mt-1 uppercase">
                            Aujourd'hui
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Sub annotations keys */}
                <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold text-slate-600 border-t pt-3 border-slate-200">
                  <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 bg-[#0b6b9e] rounded"></span> Astreinte Jour (8h-20h)</span>
                  <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 bg-[#0b2a4a] rounded"></span> Astreinte Nuit (20h-8h)</span>
                  <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 bg-[#b13e3e] rounded"></span> Garde Week-end (24h)</span>
                </div>
              </div>

            </div>
          )}

          {/* ---- DOCUMENTS ---- */}
          {activeTab === "documents" && (
            <div className="animate-fade flex flex-col gap-4">
              <h3 className="text-base font-bold text-[#0b2a4a] flex items-center gap-2">
                <i className="fas fa-file-medical text-sky-600"></i> Bibliothèque d'Archives et de Documents Historiques
              </h3>

              <div className="card p-5">
                <div 
                  className="list-item py-2 px-3 hover:bg-slate-100 flex items-center gap-3.5 cursor-pointer rounded-xl"
                  onClick={() => triggerModalDescriptive("Ordonnance Médicale", [{ label: "Fichier", value: "ordonnance_2026-06-22.pdf" }, { label: "Taille", value: "142 KB" }], ["PDF"])}
                >
                  <i className="fas fa-file-pdf text-[#b13e3e] text-lg"></i>
                  <div className="text-sm">
                    <strong>ordonnance_2026-06-22.pdf</strong>
                    <span className="block text-[10px] text-slate-400">Signée par {currentUser.name || "Dr. Martin"}</span>
                  </div>
                </div>

                <div 
                  className="list-item py-2 px-3 hover:bg-slate-100 flex items-center gap-3.5 cursor-pointer rounded-xl mt-2"
                  onClick={() => triggerModalDescriptive("Certificat d'arrêt temporaire de travail", [{ label: "Fichier", value: "certificat_arret_2026-06-22.pdf" }, { label: "Justification", value: "État grippal fébrile sévère" }], ["PDF"])}
                >
                  <i className="fas fa-file-pdf text-[#b13e3e] text-lg"></i>
                  <div className="text-sm">
                    <strong>certificat_arret_2026-06-22.pdf</strong>
                    <span className="block text-[10px] text-slate-400">Délivré ce jour · Valable 3 jours</span>
                  </div>
                </div>

                <div className="mt-4">
                  <button 
                    className="btn btn-primary btn-sm rounded-lg"
                    onClick={() => alert("📤 Téléverser ou générer un nouveau certificat de médecine...")}
                  >
                    <i className="fas fa-upload mr-1.5"></i> Joindre un Document Externe
                  </button>
                </div>
              </div>

              <div 
                className="synthese-block p-4 rounded-xl border border-sky-200 cursor-pointer"
                onClick={() => triggerModalDescriptive(
                  "Synthèse complète",
                  [
                    { label: "Résumé Général", value: `Patient ${activePatient.lastName} diagnostiqué avec ${examenClinique}. Taux stable.` },
                    { label: "Traitement", value: "Amoxicilline 500mg, Paracétamol 1g" }
                  ],
                  ["PDF"]
                )}
              >
                <div className="text-slate-800 text-sm font-semibold flex items-center gap-2">
                  <i className="fas fa-check-circle text-emerald-600 text-base"></i>
                  <span>Synthèse consultation N° 2026-06-22-001 de MédiSahel</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Diagnostic principal de médecine générale : {examenClinique || "Infection respiratoire haute"}.</p>
              </div>
            </div>
          )}

          {/* ---- WORKFLOW OFFICIEL SIMULATOR ---- */}
          {activeTab === "workflow" && (
            <div className="animate-fade flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <i className="fas fa-route text-amber-500 text-lg"></i>
                <h3 className="text-base font-bold text-[#0b2a4a]">
                  Workflow Officiel du Patient &amp; Laboratoire (Règles ERP &amp; Traçabilité)
                </h3>
              </div>
              
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl text-amber-900 text-xs font-semibold leading-relaxed">
                <strong className="block text-sm font-bold mb-1">Directive d'Intégrité MédiSahel :</strong>
                &ldquo;Aucun examen ne doit arriver au laboratoire sans validation financière.&rdquo;<br/>
                <strong>Circuit d'Accréditation :</strong> Caissier (Paiement consultation) ➔ Médecin (Prescription examen) ➔ Caissier (Paiement examen) ➔ Laboratoire (Saisie/Sceau) ➔ Médecin (Intégration DME instantanée).
              </div>

              <DmgLabScenario showToast={(msg) => {
                console.log(`[MédiSahel Notification]: ${msg}`);
              }} />
            </div>
          )}

        </div>

        {/* ===== DISCREET AUDIT FOOTER ===== */}
        <div className="footer-trace p-4 border-t flex flex-wrap justify-between items-center text-[10px] md:text-xs text-[#4f6f8a] bg-slate-50">
          <span>
            <i className="fas fa-clock text-slate-400 mr-1.5"></i> Dossier patient mis à jour le 22/06/2026 par {currentUser.name || "Dr. Martin"}
          </span>
          <span>
            <i className="fas fa-wrench text-slate-400 mr-1.5"></i> DMG Suite v3.2.1 · {staffList.length} membres médicaux enregistrés
          </span>
        </div>

      </div>

      {/* ========================================================= */}
      {/* ===== INTERACTIVE MODAL OVERLAY BOX ===== */}
      {activeModalKey && (
        <div 
          className="modal-overlay fixed inset-0 flex items-center justify-center p-4 z-[999]"
          onClick={handleCloseModal}
        >
          <div 
            className="modal bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative border border-slate-200 animate-fade"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Cross icon */}
            <button 
              className="modal-close absolute top-3.5 right-4 text-slate-450 hover:text-slate-800 text-2xl"
              onClick={handleCloseModal}
            >
              &times;
            </button>

            <h3 className="modal-title text-[#0b2a4a] text-lg font-black mb-4 flex items-center gap-2">
              {modalTitle}
            </h3>

            {/* If simple descriptive info modal */}
            {modalFormType === "none" && (
              <div className="flex flex-col gap-3">
                {modalDetails.map((detail, idx) => (
                  <div key={idx} className="detail-row flex justify-between gap-4 border-b border-slate-100 py-1.5 text-xs text-slate-700">
                    <span className="dlabel font-bold text-slate-800 min-w-[120px]">{detail.label} :</span>
                    <span className="text-slate-600 font-medium">{detail.value}</span>
                  </div>
                ))}

                {modalButtons.length > 0 && (
                  <div className="flex gap-2.5 mt-5">
                    {modalButtons.map((btn, idx) => (
                      <button 
                        key={idx} 
                        className={`btn px-4 py-2 text-xs font-bold rounded-lg ${btn.includes("Fermer") || btn.includes("Annuler") ? "btn-light" : "btn-danger"}`}
                        onClick={handleCloseModal}
                      >
                        {btn}
                      </button>
                    ))}
                  </div>
                )}

                {modalExports.length > 0 && (
                  <div className="flex gap-2.5 mt-5">
                    {modalExports.includes("PDF") && (
                      <button className="btn btn-outline flex items-center gap-1.5" onClick={() => alert("📄 Exportation du PDF de clinique réussie !")}>
                        <i className="fas fa-file-pdf text-[#b13e3e]"></i> Générer PDF
                      </button>
                    )}
                    {modalExports.includes("Excel") && (
                      <button className="btn btn-outline flex items-center gap-1.5" onClick={() => alert("📊 Fichier excel bien exporté !")}>
                        <i className="fas fa-file-excel text-emerald-800"></i> Générer Excel
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* FORM: ADD STAFF */}
            {modalFormType === "addStaff" && (
              <form onSubmit={handleAddNewStaffSubmit} className="flex flex-col gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">Nom Complet du Praticien</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="ex: Dr. Ibrahim TOURÉ, Fatoumata DIARRA"
                    className="w-full border px-3 py-2 rounded-lg text-sm bg-white"
                    value={tempStaffName}
                    onChange={(e) => setTempStaffName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-700">Rôle / Grade</label>
                    <select 
                      className="w-full border px-2 py-2 rounded-lg text-sm bg-white"
                      value={tempStaffRole}
                      onChange={(e) => setTempStaffRole(e.target.value as any)}
                    >
                      <option value="Infirmier">Infirmier</option>
                      <option value="Aide-soignant">Aide-soignant</option>
                      <option value="Stagiaire">Stagiaire</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-700">Disponibilité initiale</label>
                    <select 
                      className="w-full border px-2 py-2 rounded-lg text-sm bg-white"
                      value={tempStaffStatus}
                      onChange={(e) => setTempStaffStatus(e.target.value as any)}
                    >
                      <option value="Présent">En service (Présent)</option>
                      <option value="En garde">Astreinte de garde</option>
                      <option value="Congé">Congé</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">Tâche Principale / Spécialité</label>
                  <input 
                    type="text" 
                    placeholder="Urgences, pédiatrie..."
                    className="w-full border px-3 py-2 rounded-lg text-sm bg-white"
                    value={tempStaffDuty}
                    onChange={(e) => setTempStaffDuty(e.target.value)}
                  />
                </div>

                <div className="flex gap-2.5 mt-4 justify-end">
                  <button type="submit" className="btn btn-primary font-bold">Inscrire membre</button>
                  <button type="button" className="btn btn-light font-bold" onClick={handleCloseModal}>Annuler</button>
                </div>
              </form>
            )}

            {/* FORM: EDIT STAFF */}
            {modalFormType === "editStaff" && (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  setStaffList(staffList.map(member => {
                    if (member.name === tempStaffName) {
                      return { ...member, role: tempStaffRole as any, status: tempStaffStatus, duty: tempStaffDuty || member.duty };
                    }
                    return member;
                  }));
                  handleCloseModal();
                  alert("✅ Membre configuré avec succès !");
                }} 
                className="flex flex-col gap-3 text-xs"
              >
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">Nom du Praticien</label>
                  <input 
                    type="text" 
                    className="w-full border px-3 py-2 rounded-lg text-sm bg-slate-100" 
                    value={tempStaffName} 
                    disabled 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-700">Rôle</label>
                    <select 
                      className="w-full border px-2 py-2 rounded-lg text-sm bg-white"
                      value={tempStaffRole}
                      onChange={(e) => setTempStaffRole(e.target.value as any)}
                    >
                      <option value="Infirmier">Infirmier</option>
                      <option value="Aide-soignant">Aide-soignant</option>
                      <option value="Stagiaire">Stagiaire</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-700">Disponibilité corporelle</label>
                    <select 
                      className="w-full border px-2 py-2 rounded-lg text-sm bg-white"
                      value={tempStaffStatus}
                      onChange={(e) => setTempStaffStatus(e.target.value as any)}
                    >
                      <option value="Présent">Présent</option>
                      <option value="Absent">Absent</option>
                      <option value="Congé">Congé</option>
                      <option value="En garde">En garde astreinte</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">Spécialité / Service de rotation</label>
                  <input 
                    type="text" 
                    className="w-full border px-3 py-2 rounded-lg text-sm bg-white" 
                    value={tempStaffDuty} 
                    onChange={(e) => setTempStaffDuty(e.target.value)} 
                  />
                </div>

                <div className="flex gap-2.5 mt-4 justify-end">
                  <button type="submit" className="btn btn-primary font-bold">Valider modification</button>
                  <button type="button" className="btn btn-light font-bold" onClick={handleCloseModal}>Annuler</button>
                </div>
              </form>
            )}

            {/* FORM: ASSIGN TASK */}
            {modalFormType === "assignTask" && (
              <form onSubmit={handleAssignTaskSubmit} className="flex flex-col gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">Désigner l'exécuteur</label>
                  <select 
                    className="w-full border px-2 py-2 rounded-lg text-xs bg-white"
                    value={tempTaskStaff}
                    onChange={(e) => setTempTaskStaff(e.target.value)}
                  >
                    {staffList.map(member => (
                      <option key={member.id} value={member.name}>{member.name} ({member.role})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">Soin à réaliser (Intitulé)</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="ex: Changement de pansement digestif..."
                    className="w-full border px-3 py-2 rounded-lg text-xs bg-white"
                    value={tempTaskName}
                    onChange={(e) => setTempTaskName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-700">Degré d'urgence</label>
                    <select 
                      className="w-full border px-2 py-2 rounded-lg text-xs bg-white"
                      value={tempTaskPriority}
                      onChange={(e) => setTempTaskPriority(e.target.value as any)}
                    >
                      <option value="NORMAL">NORMAL</option>
                      <option value="URGENT">URGENT (Vitale)</option>
                      <option value="BASSE">BASSE (Suivi)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-700">Créneau horaire</label>
                    <select 
                      className="w-full border px-2 py-2 rounded-lg text-xs bg-white"
                      value={tempTaskType}
                      onChange={(e) => setTempTaskType(e.target.value)}
                    >
                      <option value="Jour (8h-20h)">Jour (8h-20h)</option>
                      <option value="Nuit (20h-8h)">Nuit (20h-8h)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">Description / Remarques cliniques</label>
                  <textarea 
                    placeholder="Informations supplémentaires utiles..."
                    className="w-full border px-3 py-1.5 rounded-lg text-xs bg-white"
                    rows={2}
                    value={tempTaskDetails}
                    onChange={(e) => setTempTaskDetails(e.target.value)}
                  />
                </div>

                <div className="flex gap-2.5 mt-4 justify-end">
                  <button type="submit" className="btn btn-primary font-bold">Attribuer soin</button>
                  <button type="button" className="btn btn-light font-bold" onClick={handleCloseModal}>Annuler</button>
                </div>
              </form>
            )}

            {/* FORM: ASSIGN GARDE */}
            {modalFormType === "assignGarde" && (
              <form onSubmit={handleAssignGardeSubmit} className="flex flex-col gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">Médecin ou Assistant d'Astreinte</label>
                  <select 
                    className="w-full border px-2 py-2 rounded-lg text-xs bg-white"
                    value={tempGardeStaff}
                    onChange={(e) => setTempGardeStaff(e.target.value)}
                  >
                    {staffList.map(member => (
                      <option key={member.id} value={member.name}>{member.name} ({member.role})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-700">Date de roulement</label>
                    <input 
                      type="date" 
                      className="w-full border px-2 py-1.5 rounded-lg text-xs bg-white" 
                      value={tempGardeDate} 
                      onChange={(e) => setTempGardeDate(e.target.value)} 
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-700">Service d'horaire</label>
                    <select 
                      className="w-full border px-2 py-1.5 rounded-lg text-xs bg-white"
                      value={tempGardeType}
                      onChange={(e) => setTempGardeType(e.target.value)}
                    >
                      <option value="Jour (8h-20h)">Jour (8h - 20h)</option>
                      <option value="Nuit (20h-8h)">Nuit (20h - 8h)</option>
                      <option value="Week-end (24h)">Week-end complet (24h)</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2.5 mt-4 justify-end">
                  <button type="submit" className="btn btn-primary font-bold">Valider affectation</button>
                  <button type="button" className="btn btn-light font-bold" onClick={handleCloseModal}>Annuler</button>
                </div>
              </form>
            )}

            {!modalButtons.length && modalFormType === "none" && (
              <div className="mt-5 flex justify-end">
                <button className="btn btn-primary font-bold text-xs px-5 py-2.5 rounded-lg" onClick={handleCloseModal}>
                  Fermer la fiche
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
