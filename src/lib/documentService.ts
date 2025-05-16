import { supabase } from "./supabaseClient";
import { generateUUID } from "./utils";

export interface Document {
  id: string;
  title: string;
  content?: string;
  createdAt?: Date;
  updatedAt: Date;
}

function mapToFrontendDocument(doc: any): Document {
  return {
    id: doc.id,
    title: doc.title,
    content: doc.content,
    createdAt: doc.created_at ? new Date(doc.created_at) : undefined,
    updatedAt: new Date(doc.updated_at)
  };
}

function mapToSupabaseDocument(doc: Document): any {
  return {
    id: doc.id,
    title: doc.title,
    content: doc.content,
    created_at: doc.createdAt?.toISOString(),
    updated_at: doc.updatedAt.toISOString()
  };
}

export async function getUserDocuments(): Promise<Document[]> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      console.error("No authenticated user found");
      return [];
    }
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", user.user.id)
      .order("updated_at", { ascending: false });
    if (error) {
      console.error("Error fetching documents:", error);
      return [];
    }
    return data?.map(mapToFrontendDocument) || [];
  } catch (error) {
    console.error("Error in getUserDocuments:", error);
    return [];
  }
}

export async function createDocument(doc: Document): Promise<Document | null> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      console.error("No authenticated user found");
      return null;
    }
    const supaDoc = mapToSupabaseDocument(doc);
    const { data, error } = await supabase
      .from("documents")
      .insert({
        id: doc.id || generateUUID(),
        user_id: user.user.id,
        title: doc.title,
        content: doc.content,
        created_at: doc.createdAt?.toISOString() || new Date().toISOString(),
        updated_at: doc.updatedAt.toISOString()
      })
      .select()
      .single();
    if (error) {
      console.error("Error creating document:", error);
      return null;
    }
    return mapToFrontendDocument(data);
  } catch (error) {
    console.error("Error in createDocument:", error);
    return null;
  }
}

export async function updateDocument(id: string, doc: Partial<Document>): Promise<Document | null> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      console.error("No authenticated user found");
      return null;
    }
    const updateData: any = {};
    if (doc.title) updateData.title = doc.title;
    if (doc.content !== undefined) updateData.content = doc.content;
    if (doc.updatedAt) updateData.updated_at = doc.updatedAt.toISOString();
    const { data, error } = await supabase
      .from("documents")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.user.id)
      .select()
      .single();
    if (error) {
      console.error("Error updating document:", error);
      return null;
    }
    return mapToFrontendDocument(data);
  } catch (error) {
    console.error("Error in updateDocument:", error);
    return null;
  }
}

export async function deleteDocument(id: string): Promise<boolean> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      console.error("No authenticated user found");
      return false;
    }
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", id)
      .eq("user_id", user.user.id);
    if (error) {
      console.error("Error deleting document:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error in deleteDocument:", error);
    return false;
  }
}

export async function syncDocuments(localDocuments: Document[]): Promise<Document[]> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      console.error("No authenticated user found");
      return localDocuments;
    }
    const cloudDocuments = await getUserDocuments();
    const documentsToCreate = localDocuments.filter(localDoc => 
      !cloudDocuments.some(cloudDoc => cloudDoc.id === localDoc.id)
    );
    for (const doc of documentsToCreate) {
      await createDocument(doc);
    }
    return await getUserDocuments();
  } catch (error) {
    console.error("Error syncing documents:", error);
    return localDocuments;
  }
}