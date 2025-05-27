import { adminDb } from "@/lib/firebase/admin";
import { Agent } from "@/lib/firebase/schema";

export class ServerAgentsService {
  private collectionName = "myagents";

  /**
   * Get agents by product ID and user ID
   */
  async getAgentsByProduct(
    userId: string,
    productId: string
  ): Promise<Agent[]> {
    try {
      const collectionRef = adminDb
        .collection(this.collectionName)
        .doc(userId)
        .collection(this.collectionName);

      const snapshot = await collectionRef
        .where("productId", "==", productId)
        .orderBy("updatedAt", "desc")
        .get();

      return snapshot.docs.map(
        (doc) =>
          ({
            ...doc.data(),
            id: doc.id,
          }) as Agent
      );
    } catch (error) {
      console.error("[ServerAgentsService][getAgentsByProduct] Error:", error);
      return [];
    }
  }

  /**
   * Get an agent by ID and user ID
   */
  async getAgentById(userId: string, agentId: string): Promise<Agent | null> {
    try {
      const docRef = adminDb
        .collection(this.collectionName)
        .doc(userId)
        .collection(this.collectionName)
        .doc(agentId);

      const doc = await docRef.get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      return {
        ...data,
        id: doc.id,
      } as Agent;
    } catch (error) {
      console.error("[ServerAgentsService][getAgentById] Error:", error);
      return null;
    }
  }

  /**
   * Get an agent by ID for public access (searches across all users)
   */
  async getPublicAgentById(agentId: string): Promise<Agent | null> {
    try {
      console.log(
        `[ServerAgentsService][getPublicAgentById] Searching for agent: ${agentId}`
      );

      // Use collection group query to search across all user subcollections
      const agentsQuery = adminDb.collectionGroup(this.collectionName);
      const snapshot = await agentsQuery.get();

      console.log(
        `[ServerAgentsService][getPublicAgentById] Found ${snapshot.docs.length} total agents`
      );

      // Find the agent with matching ID
      const agentDoc = snapshot.docs.find((doc) => doc.id === agentId);

      if (!agentDoc) {
        console.log(
          `[ServerAgentsService][getPublicAgentById] Agent not found: ${agentId}`
        );
        return null;
      }

      const data = agentDoc.data();

      // Extract userId from the document path
      // Path format: myagents/{userId}/myagents/{agentId}
      const pathSegments = agentDoc.ref.path.split("/");
      const userId = pathSegments[1]; // The userId is the second segment

      const agent = {
        ...data,
        id: agentDoc.id,
        userId: userId, // Ensure userId is set
      } as Agent;

      console.log(
        `[ServerAgentsService][getPublicAgentById] Found agent: ${agent.name}, userId: ${agent.userId}`
      );
      console.log(
        `[ServerAgentsService][getPublicAgentById] Agent enabled: ${agent.configuration?.isEnabled}`
      );

      // Only return if the agent is enabled
      if (agent.configuration?.isEnabled) {
        return agent;
      } else {
        console.log(
          `[ServerAgentsService][getPublicAgentById] Agent found but not enabled`
        );
        return null;
      }
    } catch (error) {
      console.error("[ServerAgentsService][getPublicAgentById] Error:", error);
      return null;
    }
  }

  /**
   * Update an agent
   */
  async updateAgent(userId: string, agent: Agent): Promise<Agent | null> {
    try {
      const docRef = adminDb
        .collection(this.collectionName)
        .doc(userId)
        .collection(this.collectionName)
        .doc(agent.id);

      await docRef.update({
        ...agent,
        updatedAt: Math.floor(Date.now() / 1000),
      });

      const updatedDoc = await docRef.get();
      const data = updatedDoc.data();

      return {
        ...data,
        id: updatedDoc.id,
      } as Agent;
    } catch (error) {
      console.error("[ServerAgentsService][updateAgent] Error:", error);
      return null;
    }
  }

  /**
   * Create a new agent
   */
  async createAgent(
    userId: string,
    agent: Omit<Agent, "id">
  ): Promise<Agent | null> {
    try {
      const collectionRef = adminDb
        .collection(this.collectionName)
        .doc(userId)
        .collection(this.collectionName);

      const docRef = await collectionRef.add({
        ...agent,
        userId,
        createdAt: Math.floor(Date.now() / 1000),
        updatedAt: Math.floor(Date.now() / 1000),
      });

      const doc = await docRef.get();
      const data = doc.data();

      return {
        ...data,
        id: doc.id,
      } as Agent;
    } catch (error) {
      console.error("[ServerAgentsService][createAgent] Error:", error);
      return null;
    }
  }

  /**
   * Delete an agent
   */
  async deleteAgent(userId: string, agentId: string): Promise<boolean> {
    try {
      const docRef = adminDb
        .collection(this.collectionName)
        .doc(userId)
        .collection(this.collectionName)
        .doc(agentId);

      await docRef.delete();
      return true;
    } catch (error) {
      console.error("[ServerAgentsService][deleteAgent] Error:", error);
      return false;
    }
  }
}

export const serverAgentsService = new ServerAgentsService();
