export default abstract class Task {
    public abstract type: string;
    public abstract id: string;
    public abstract run(): void;
}
